import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSetting } from '@/lib/settings'
import { tg } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const me = await tg('getMe')
  const botUsername = me?.result?.username || ''
  const link = `https://t.me/${botUsername}?start=ref_${user.telegramId}`

  const referrals = await prisma.user.findMany({
    where: { referrerId: user.id },
    select: { firstName: true, username: true, totalEarned: true, createdAt: true },
    orderBy: { id: 'desc' },
    take: 50
  })

  const totalRefEarned = await prisma.user.aggregate({
    where: { referrerId: user.id },
    _sum: { totalEarned: true }
  })

  const pct = parseFloat(await getSetting('referral_percent'))
  const earned = (totalRefEarned._sum.totalEarned || 0) * pct / 100

  return NextResponse.json({
    ok: true,
    link,
    percent: pct,
    count: referrals.length,
    earned,
    referrals
  })
}
