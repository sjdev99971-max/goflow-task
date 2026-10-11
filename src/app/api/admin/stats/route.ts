import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const [totalUsers, totalTasks, pendingWd, pendingTasks, totalEarned] = await Promise.all([
    prisma.user.count(),
    prisma.task.count({ where: { isActive: true } }),
    prisma.withdrawal.count({ where: { status: 'pending' } }),
    prisma.taskCompletion.count({ where: { status: 'pending' } }),
    prisma.user.aggregate({ _sum: { totalEarned: true } })
  ])

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers,
      totalTasks,
      pendingWd,
      pendingTasks,
      totalEarned: totalEarned._sum.totalEarned || 0
    }
  })
}
