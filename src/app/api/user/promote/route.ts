import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSetting } from '@/lib/settings'
import { tg } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  const list = await prisma.promote.findMany({ where: { userId: user.id }, orderBy: { id: 'desc' }, take: 20 })
  return NextResponse.json({ ok: true, promotes: list })
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { type, link, amount } = await req.json()
  const amt = parseFloat(amount)
  if (!amt || amt < 1) return NextResponse.json({ ok: false, error: 'min $1' })

  const u = await prisma.user.findUnique({ where: { id: user.id } })
  if (u!.promoteBalance < amt) return NextResponse.json({ ok: false, error: 'insufficient promote balance' })

  const pct = parseFloat(await getSetting('promote_commission'))
  const comm = +(amt * pct / 100).toFixed(4)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { promoteBalance: { decrement: amt } }
    }),
    prisma.promote.create({
      data: { userId: user.id, type, link, amount: amt, commission: comm }
    })
  ])

  const admins = await prisma.user.findMany({ where: { isAdmin: true } })
  for (const a of admins) {
    try {
      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text: `🚀 <b>Promote Request</b>\n\n👤 ${u!.firstName}\n📌 ${type}\n🔗 ${link}\n💵 $${amt}\n💸 Comm $${comm}`,
        parse_mode: 'HTML'
      })
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
