import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSetting } from '@/lib/settings'
import { tg } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  const list = await prisma.withdrawal.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take: 20
  })
  return NextResponse.json({ ok: true, withdrawals: list })
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { amount, method, address } = await req.json()
  const amt = parseFloat(amount)
  const minWd = parseFloat(await getSetting('min_withdraw'))

  if (!amt || amt < minWd) return NextResponse.json({ ok: false, error: `min ${minWd}` })
  if (!['binance', 'bep20', 'tonkeeper'].includes(method)) return NextResponse.json({ ok: false, error: 'invalid method' })
  if (!address) return NextResponse.json({ ok: false, error: 'address required' })

  const u = await prisma.user.findUnique({ where: { id: user.id } })
  if (u!.mainBalance < amt) return NextResponse.json({ ok: false, error: 'insufficient' })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        mainBalance: { decrement: amt },
        totalWithdrawn: { increment: amt }
      }
    }),
    prisma.withdrawal.create({
      data: { userId: user.id, amount: amt, method, address }
    })
  ])

  const admins = await prisma.user.findMany({ where: { isAdmin: true } })
  for (const a of admins) {
    try {
      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text: `📤 <b>Withdraw Request</b>\n\n👤 ${u!.firstName} (@${u!.username || 'N/A'})\n💵 $${amt} | ${method}\n📍 <code>${address}</code>`,
        parse_mode: 'HTML'
      })
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
