import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const comps = await prisma.taskCompletion.findMany({
    where: { userId: user.id },
    include: { task: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return NextResponse.json({
    ok: true,
    items: comps.map(c => ({
      id: c.id,
      title: c.task?.title || 'Daily Check-in',
      type: c.task?.type || 'checkin',
      reward: c.reward,
      status: c.status,
      createdAt: c.createdAt
    }))
  })
}
