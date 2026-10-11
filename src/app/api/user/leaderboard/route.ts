import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'earners'

  if (type === 'referrers') {
    const rows = await prisma.user.findMany({
      orderBy: { totalReferrals: 'desc' },
      take: 10,
      select: { firstName: true, username: true, photoUrl: true, totalReferrals: true }
    })
    return NextResponse.json({ ok: true, rows })
  }

  const rows = await prisma.user.findMany({
    orderBy: { totalEarned: 'desc' },
    take: 10,
    select: { firstName: true, username: true, photoUrl: true, totalEarned: true }
  })
  return NextResponse.json({ ok: true, rows })
}
