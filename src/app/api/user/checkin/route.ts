import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REWARDS = [0.005, 0.008, 0.01, 0.015, 0.02, 0.03, 0.05] // day 1-7

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const u = await prisma.user.findUnique({ where: { id: user.id } })

  // Check today's check-in
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const lastCheck = await prisma.taskCompletion.findFirst({
    where: { userId: user.id, taskId: -1 } // special check-in task id
  })

  const canCheck = !lastCheck || new Date(lastCheck.createdAt) < today

  // Streak calculation
  const recentChecks = await prisma.taskCompletion.findMany({
    where: { userId: user.id, taskId: -1 },
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  let streak = 0
  let checkDate = new Date(); checkDate.setHours(0, 0, 0, 0)
  for (const c of recentChecks) {
    const cDate = new Date(c.createdAt); cDate.setHours(0, 0, 0, 0)
    if (cDate.getTime() === checkDate.getTime()) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (cDate.getTime() < checkDate.getTime()) {
      break
    }
  }

  return NextResponse.json({
    ok: true,
    canCheck,
    streak: Math.min(streak, 7),
    dayNumber: canCheck ? Math.min(streak + 1, 7) : Math.min(streak, 7),
    rewards: REWARDS
  })
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const existing = await prisma.taskCompletion.findFirst({
    where: { userId: user.id, taskId: -1, createdAt: { gte: today } }
  })
  if (existing) return NextResponse.json({ ok: false, error: 'already_checked' })

  // Get streak
  const recent = await prisma.taskCompletion.findMany({
    where: { userId: user.id, taskId: -1 },
    orderBy: { createdAt: 'desc' }, take: 30
  })

  let streak = 0
  let checkDate = new Date(); checkDate.setHours(0, 0, 0, 0)
  checkDate.setDate(checkDate.getDate() - 1) // yesterday
  for (const c of recent) {
    const cDate = new Date(c.createdAt); cDate.setHours(0, 0, 0, 0)
    if (cDate.getTime() === checkDate.getTime()) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }

  const dayIndex = Math.min(streak, 6)
  const reward = REWARDS[dayIndex]

  await prisma.$transaction([
    prisma.taskCompletion.create({
      data: { userId: user.id, taskId: -1, status: 'approved', reward, proof: 'checkin' }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { mainBalance: { increment: reward }, totalEarned: { increment: reward } }
    })
  ])

  return NextResponse.json({ ok: true, reward, day: dayIndex + 1 })
}
