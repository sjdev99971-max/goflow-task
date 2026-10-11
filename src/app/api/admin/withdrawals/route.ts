import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const rows = await prisma.withdrawal.findMany({
    orderBy: { id: 'desc' },
    take: 100,
    include: { user: { select: { firstName: true, username: true, telegramId: true } } }
  })
  return NextResponse.json({
    ok: true,
    withdrawals: rows.map(w => ({ ...w, userId: String(w.userId), user: { ...w.user, telegramId: String(w.user.telegramId) } }))
  })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const { id, action, note } = await req.json()

  const w = await prisma.withdrawal.findUnique({ where: { id }, include: { user: true } })
  if (!w) return NextResponse.json({ ok: false })

  if (action === 'approve') {
    await prisma.withdrawal.update({ where: { id }, data: { status: 'approved', note } })
    try { await tg('sendMessage', { chat_id: w.user.telegramId.toString(), text: `✅ আপনার Withdraw $${w.amount} approved!` }) } catch {}
  } else if (action === 'reject') {
    await prisma.$transaction([
      prisma.withdrawal.update({ where: { id }, data: { status: 'rejected', note } }),
      prisma.user.update({ where: { id: w.userId }, data: { mainBalance: { increment: w.amount }, totalWithdrawn: { decrement: w.amount } } })
    ])
    try { await tg('sendMessage', { chat_id: w.user.telegramId.toString(), text: `❌ Withdraw rejected. $${w.amount} refunded.` }) } catch {}
  }
  return NextResponse.json({ ok: true })
}
