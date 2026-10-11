import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: list submissions (pending by default)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') || 'pending'

  const subs = await prisma.taskCompletion.findMany({
    where: { status },
    include: {
      user: { select: { telegramId: true, firstName: true, username: true, photoUrl: true } },
      task: { select: { title: true, type: true, link: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return NextResponse.json({
    ok: true,
    submissions: subs.map(s => ({
      id: s.id,
      userId: String(s.userId),
      telegramId: String(s.user.telegramId),
      user: s.user,
      task: s.task,
      proof: s.proof,
      reward: s.reward,
      status: s.status,
      createdAt: s.createdAt
    }))
  })
}

// POST: approve/reject submission
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const { submissionId, action } = await req.json()
  if (!submissionId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  const sub = await prisma.taskCompletion.findUnique({
    where: { id: submissionId },
    include: { user: true, task: true }
  })
  if (!sub) return NextResponse.json({ ok: false, error: 'not_found' })
  if (sub.status !== 'pending') return NextResponse.json({ ok: false, error: 'already_processed' })

  if (action === 'approve') {
    // 🔥 CRITICAL: Add money to user's balance + referral commission
    await prisma.$transaction([
      prisma.taskCompletion.update({
        where: { id: submissionId },
        data: { status: 'approved', reviewedBy: admin.telegramId }
      }),
      prisma.user.update({
        where: { id: sub.userId },
        data: {
          mainBalance: { increment: sub.reward },
          totalEarned: { increment: sub.reward }
        }
      })
    ])

    // Referral commission
    if (sub.user.referrerId) {
      const pct = parseFloat(await getSetting('referral_percent')) || 10
      const comm = +(sub.reward * pct / 100).toFixed(4)
      await prisma.user.update({
        where: { id: sub.user.referrerId },
        data: {
          mainBalance: { increment: comm },
          totalEarned: { increment: comm }
        }
      })
    }

    // Notify user
    try {
      await tg('sendMessage', {
        chat_id: sub.user.telegramId.toString(),
        text: `✅ <b>Task Approved!</b>\n\n📌 ${sub.task.title}\n💰 <b>+$${sub.reward.toFixed(4)}</b> added to your balance`,
        parse_mode: 'HTML'
      })
    } catch {}

  } else {
    await prisma.taskCompletion.update({
      where: { id: submissionId },
      data: { status: 'rejected', reviewedBy: admin.telegramId }
    })

    try {
      await tg('sendMessage', {
        chat_id: sub.user.telegramId.toString(),
        text: `❌ <b>Task Rejected</b>\n\n📌 ${sub.task.title}\n\nসঠিক proof দিয়ে আবার submit করুন।`,
        parse_mode: 'HTML'
      })
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
