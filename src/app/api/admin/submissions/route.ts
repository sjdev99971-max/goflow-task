import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
      escalated: s.escalated,
      rejectReason: s.rejectReason,
      createdAt: s.createdAt
    }))
  })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const { submissionId, action, reason } = await req.json()
  if (!submissionId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }

  // ⚠️ Reject এর জন্য reason MUST
  if (action === 'reject' && (!reason || !reason.trim())) {
    return NextResponse.json({ ok: false, error: 'reason_required' }, { status: 400 })
  }

  const sub = await prisma.taskCompletion.findUnique({
    where: { id: submissionId },
    include: { user: true, task: true }
  })
  if (!sub) return NextResponse.json({ ok: false, error: 'not_found' })
  if (sub.status !== 'pending') return NextResponse.json({ ok: false, error: 'already_processed' })

  if (action === 'approve') {
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

    if (sub.user.referrerId) {
      const pct = parseFloat(await getSetting('referral_percent')) || 10
      const comm = +(sub.reward * pct / 100).toFixed(4)
      await prisma.user.update({
        where: { id: sub.user.referrerId },
        data: { mainBalance: { increment: comm }, totalEarned: { increment: comm } }
      })
    }

    try {
      await tg('sendMessage', {
        chat_id: sub.user.telegramId.toString(),
        text: `✅ <b>Task Approved!</b>\n\n📌 ${sub.task.title}\n💰 <b>+$${sub.reward.toFixed(4)}</b> balance এ যোগ হয়েছে`,
        parse_mode: 'HTML'
      })
    } catch {}

  } else {
    await prisma.taskCompletion.update({
      where: { id: submissionId },
      data: {
        status: 'rejected',
        reviewedBy: admin.telegramId,
        rejectedBy: admin.telegramId,
        rejectReason: reason.trim()
      }
    })

    try {
      await tg('sendMessage', {
        chat_id: sub.user.telegramId.toString(),
        text: `❌ <b>Task Rejected</b>\n\n📌 ${sub.task.title}\n\n📝 <b>Reason:</b> ${reason.trim()}\n\nসঠিক ভাবে আবার try করুন।`,
        parse_mode: 'HTML'
      })
    } catch {}

    // Notify ALL admins about rejection (audit trail)
    const allAdmins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { telegramId: true }
    })
    for (const a of allAdmins) {
      if (a.telegramId.toString() === admin.telegramId.toString()) continue
      try {
        await tg('sendMessage', {
          chat_id: a.telegramId.toString(),
          text: `🚫 <b>Rejection Log</b>\n\n👤 ${sub.user.firstName}\n📌 ${sub.task.title}\n❌ By @${admin.username || 'admin'}\n📝 ${reason.trim()}`,
          parse_mode: 'HTML'
        })
      } catch {}
    }
  }

  return NextResponse.json({ ok: true })
}
