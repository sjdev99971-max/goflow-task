import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AUTO_TYPES = ['join_chat', 'bot', 'group']

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 })

  const { taskId, proof, image } = await req.json()
  if (!taskId) return NextResponse.json({ ok: false, error: 'task_required' }, { status: 400 })

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || !task.isActive) return NextResponse.json({ ok: false, error: 'invalid_task' })

  // Already done check
  const existing = await prisma.taskCompletion.findUnique({
    where: { userId_taskId: { userId: user.id, taskId } }
  })
  if (existing) {
    return NextResponse.json({
      ok: false,
      error: 'already_done',
      status: existing.status
    })
  }

  const reward = +(task.reward * (1 - task.adminCut / 100)).toFixed(4)
  const isAuto = task.verifyType === 'auto' || AUTO_TYPES.includes(task.type)

  // ═══════════════════════════════════════════════
  //  AUTO VERIFY (Telegram) — never falls to manual
  // ═══════════════════════════════════════════════
  if (isAuto) {
    const isTg = task.link.startsWith('@') ||
                 task.link.includes('t.me/') ||
                 task.link.startsWith('-100')

    if (!isTg) {
      // Auto type but non-TG link — config issue, escalate
      const comp = await prisma.taskCompletion.create({
        data: {
          userId: user.id, taskId, status: 'pending',
          proof: 'auto-type-but-non-tg-link', reward,
          adminCut: task.adminCut, escalated: true
        }
      })
      await notifyAdmins(user, task, reward, 'escalated', 'Auto task has non-Telegram link')
      return NextResponse.json({ ok: true, escalated: true })
    }

    try {
      const chatId = task.link.startsWith('http')
        ? task.link.replace('https://t.me/', '@')
        : task.link

      const r = await tg('getChatMember', {
        chat_id: chatId,
        user_id: Number(user.telegramId)
      })

      // Telegram API returned an error (bot not admin, channel not found, etc)
      if (!r.ok) {
        const comp = await prisma.taskCompletion.create({
          data: {
            userId: user.id, taskId, status: 'pending',
            proof: `auto-fail: ${r.description || 'telegram_error'}`,
            reward, adminCut: task.adminCut, escalated: true
          }
        })
        await notifyAdmins(user, task, reward, 'escalated', r.description || 'Telegram API error')
        return NextResponse.json({
          ok: true,
          escalated: true,
          message: 'Admin manually verify করবেন'
        })
      }

      // Telegram OK — check membership
      const status = r.result?.status
      if (status === 'left' || status === 'kicked') {
        return NextResponse.json({
          ok: false,
          error: 'not_joined',
          message: '❌ আপনি এখনো join করেননি। Join করে আবার Verify চাপুন।'
        })
      }

      // ✅ SUCCESS — Instant approve
      await prisma.taskCompletion.create({
        data: {
          userId: user.id, taskId, status: 'approved',
          proof: 'auto-verified', reward, adminCut: task.adminCut
        }
      })

      await prisma.user.update({
        where: { id: user.id },
        data: {
          mainBalance: { increment: reward },
          totalEarned: { increment: reward }
        }
      })

      // Referral commission
      const u = await prisma.user.findUnique({ where: { id: user.id } })
      if (u?.referrerId) {
        const pct = parseFloat(await getSetting('referral_percent')) || 10
        const comm = +(reward * pct / 100).toFixed(4)
        await prisma.user.update({
          where: { id: u.referrerId },
          data: {
            mainBalance: { increment: comm },
            totalEarned: { increment: comm }
          }
        })
      }

      return NextResponse.json({
        ok: true,
        autoApproved: true,
        reward
      })
    } catch (e: any) {
      // Exception — escalate
      const comp = await prisma.taskCompletion.create({
        data: {
          userId: user.id, taskId, status: 'pending',
          proof: `auto-exception: ${(e.message || 'unknown').substring(0, 150)}`,
          reward, adminCut: task.adminCut, escalated: true
        }
      })
      await notifyAdmins(user, task, reward, 'escalated', e.message)
      return NextResponse.json({ ok: true, escalated: true })
    }
  }

  // ═══════════════════════════════════════════════
  //  MANUAL VERIFY (Non-Telegram)
  // ═══════════════════════════════════════════════
  const textProof = (proof || '').trim()
  const hasImage = image && typeof image === 'string' && image.length > 100

  if (!textProof && !hasImage) {
    return NextResponse.json({
      ok: false,
      error: 'proof_required',
      message: '📸 Screenshot বা username দিন'
    })
  }

  // Store proof — image thumbnail stored (truncated), full stored separately if needed
  let proofStr = textProof
  if (hasImage) {
    const imgRef = image.substring(0, 300)
    proofStr = textProof ? `${textProof}\n[IMG]${imgRef}` : `[IMG]${imgRef}`
  }

  const comp = await prisma.taskCompletion.create({
    data: {
      userId: user.id, taskId, status: 'pending',
      proof: proofStr.substring(0, 1000),
      reward, adminCut: task.adminCut
    }
  })

  await notifyAdmins(user, task, reward, 'pending')

  return NextResponse.json({
    ok: true,
    pending: true,
    message: 'Admin approve করলে balance এ যোগ হবে',
    completionId: comp.id
  })
}

async function notifyAdmins(user: any, task: any, reward: number, kind: string, extraMsg?: string) {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true }, select: { telegramId: true }
  })
  const emoji = kind === 'escalated' ? '🚨' : '📸'
  const title = kind === 'escalated' ? 'ESCALATED (Auto-verify failed)' : 'New Submission'

  for (const a of admins) {
    try {
      let text = `${emoji} <b>${title}</b>\n\n` +
        `👤 ${user.firstName} (@${user.username || 'no-username'})\n` +
        `🆔 <code>${user.telegramId}</code>\n` +
        `📌 ${task.title}\n` +
        `💰 $${reward}`
      if (extraMsg) text += `\n⚠️ ${extraMsg}`
      text += `\n\n👉 Admin Panel → Approvals`

      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text, parse_mode: 'HTML'
      })
    } catch {}
  }
}
