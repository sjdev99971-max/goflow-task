import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSetting } from '@/lib/settings'
import { tg } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const list = await prisma.promote.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take: 20
  })

  const u = await prisma.user.findUnique({ where: { id: user.id } })

  return NextResponse.json({
    ok: true,
    promotes: list,
    balances: {
      main: u?.mainBalance || 0,
      promote: u?.promoteBalance || 0
    },
    minPromote: parseFloat(await getSetting('min_promote')) || 1
  })
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { type, link, amount, payFrom } = await req.json()
  const amt = parseFloat(amount)
  const minProm = parseFloat(await getSetting('min_promote')) || 1

  if (!type || !link) return NextResponse.json({ ok: false, error: 'missing_fields' })
  if (!amt || amt < minProm) return NextResponse.json({ ok: false, error: `min_${minProm}` })

  const u = await prisma.user.findUnique({ where: { id: user.id } })
  if (!u) return NextResponse.json({ ok: false, error: 'user_not_found' })

  const source = payFrom === 'main' ? 'main' : 'promote'
  const available = source === 'main' ? u.mainBalance : u.promoteBalance

  if (available < amt) {
    return NextResponse.json({
      ok: false,
      error: `insufficient_${source}`,
      available
    })
  }

  const pct = parseFloat(await getSetting('promote_commission')) || 20
  const commission = +(amt * pct / 100).toFixed(4)

  const updateData: any = {}
  if (source === 'main') updateData.mainBalance = { decrement: amt }
  else updateData.promoteBalance = { decrement: amt }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: updateData }),
    prisma.promote.create({
      data: {
        userId: user.id,
        type,
        link,
        amount: amt,
        commission,
        note: `paid_from_${source}`
      }
    })
  ])

  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { telegramId: true } })
  for (const a of admins) {
    try {
      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text: `🚀 <b>New Promote Request</b>\n\n👤 ${u.firstName}\n📌 ${type}\n🔗 <code>${link}</code>\n💵 $${amt}\n💸 Commission: $${commission}\n💰 Paid from: <b>${source.toUpperCase()}</b>`,
        parse_mode: 'HTML'
      })
    } catch {}
  }

  return NextResponse.json({ ok: true, paidFrom: source, commission })
}
