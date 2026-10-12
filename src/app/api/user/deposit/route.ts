import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const METHODS = ['binance', 'bep20', 'tonkeeper']

// GET: user's deposits + admin addresses
export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const deposits = await prisma.deposit.findMany({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
    take: 20
  })

  const methods = {
    binance: await getSetting('deposit_binance_uid'),
    bep20: await getSetting('deposit_bep20_address'),
    tonkeeper: await getSetting('deposit_ton_address')
  }

  const minDeposit = parseFloat(await getSetting('min_deposit')) || 1

  return NextResponse.json({
    ok: true,
    deposits: deposits.map(d => ({
      ...d,
      userId: String(d.userId),
      reviewedBy: d.reviewedBy ? String(d.reviewedBy) : null
    })),
    methods,
    minDeposit
  })
}

// POST: submit deposit
export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { amount, method, txid, senderAddr } = await req.json()

  if (!METHODS.includes(method)) {
    return NextResponse.json({ ok: false, error: 'invalid_method' }, { status: 400 })
  }
  const amt = parseFloat(amount)
  const minDep = parseFloat(await getSetting('min_deposit')) || 1
  if (!amt || amt < minDep) {
    return NextResponse.json({ ok: false, error: `min_${minDep}` }, { status: 400 })
  }
  if (!txid || !txid.trim()) {
    return NextResponse.json({ ok: false, error: 'txid_required' }, { status: 400 })
  }

  const dep = await prisma.deposit.create({
    data: {
      userId: user.id,
      amount: amt,
      method,
      txid: txid.trim(),
      senderAddr: senderAddr?.trim() || null
    }
  })

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { telegramId: true }
  })
  for (const a of admins) {
    try {
      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text: `💳 <b>New Deposit Request</b>\n\n👤 ${user.firstName} (@${user.username || 'user'})\n🆔 <code>${user.telegramId}</code>\n💵 <b>$${amt}</b>\n💳 Method: ${method.toUpperCase()}\n📎 TXID: <code>${txid}</code>\n\n👉 Admin Panel → Deposits`,
        parse_mode: 'HTML'
      })
    } catch {}
  }

  return NextResponse.json({ ok: true, depositId: dep.id })
}
