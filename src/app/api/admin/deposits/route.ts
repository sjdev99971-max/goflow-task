import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') || 'pending'
  const deposits = await prisma.deposit.findMany({
    where: { status },
    include: {
      user: { select: { telegramId: true, firstName: true, username: true, photoUrl: true } }
    },
    orderBy: { id: 'desc' },
    take: 100
  })

  return NextResponse.json({
    ok: true,
    deposits: deposits.map(d => ({
      ...d,
      userId: String(d.userId),
      reviewedBy: d.reviewedBy ? String(d.reviewedBy) : null,
      user: { ...d.user, telegramId: String(d.user.telegramId) }
    }))
  })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const { depositId, action, reason, creditTo } = await req.json()
  if (!depositId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }
  if (action === 'reject' && (!reason || !reason.trim())) {
    return NextResponse.json({ ok: false, error: 'reason_required' }, { status: 400 })
  }

  const dep = await prisma.deposit.findUnique({
    where: { id: depositId },
    include: { user: true }
  })
  if (!dep) return NextResponse.json({ ok: false, error: 'not_found' })
  if (dep.status !== 'pending') return NextResponse.json({ ok: false, error: 'already_processed' })

  if (action === 'approve') {
    // creditTo: 'main' | 'promote' | 'both' (default main)
    const target = creditTo || 'main'
    const data: any = {}
    if (target === 'main' || target === 'both') data.mainBalance = { increment: dep.amount }
    if (target === 'promote' || target === 'both') data.promoteBalance = { increment: dep.amount }

    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data: { status: 'approved', reviewedBy: admin.telegramId }
      }),
      prisma.user.update({ where: { id: dep.userId }, data })
    ])

    try {
      await tg('sendMessage', {
        chat_id: dep.user.telegramId.toString(),
        text: `✅ <b>Deposit Approved!</b>\n\n💵 $${dep.amount} added to your ${target} balance.`,
        parse_mode: 'HTML'
      })
    } catch {}
  } else {
    await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'rejected', reviewedBy: admin.telegramId, rejectReason: reason.trim() }
    })
    try {
      await tg('sendMessage', {
        chat_id: dep.user.telegramId.toString(),
        text: `❌ <b>Deposit Rejected</b>\n\n💵 $${dep.amount}\n📝 Reason: ${reason.trim()}`,
        parse_mode: 'HTML'
      })
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
