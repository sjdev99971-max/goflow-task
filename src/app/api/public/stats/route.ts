import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  try {
    const [totalUsers, totalEarned, totalTasks] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { totalEarned: true } }),
      prisma.taskCompletion.count({ where: { status: 'approved' } })
    ])

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: totalUsers + 751000,
        totalRewards: (totalEarned._sum.totalEarned || 0) + 160000,
        totalTasks: totalTasks + 35000,
        runningDays: 279
      }
    })
  } catch (e) {
    return NextResponse.json({
      ok: true,
      stats: { totalUsers: 751000, totalRewards: 160000, totalTasks: 35000, runningDays: 279 }
    })
  }
}
