import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [totalUsers, earnedAgg, totalTasks] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { totalEarned: true } }),
      prisma.taskCompletion.count({ where: { status: 'approved' } })
    ])

    // Running days from first user
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
    const runningDays = firstUser
      ? Math.max(1, Math.floor((Date.now() - new Date(firstUser.createdAt).getTime()) / 86400000))
      : 1

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers,
        totalRewards: earnedAgg._sum.totalEarned || 0,
        totalTasks,
        runningDays
      }
    })
  } catch (e) {
    return NextResponse.json({
      ok: true,
      stats: { totalUsers: 0, totalRewards: 0, totalTasks: 0, runningDays: 0 }
    })
  }
}
