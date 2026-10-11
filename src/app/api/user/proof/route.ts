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
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { taskId, proof } = await req.json()
  if (!taskId) return NextResponse.json({ ok: false, error: 'task_required' }, { status: 400 })

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || !task.isActive) return NextResponse.json({ ok: false, error: 'invalid_task' })

  // 1 user = 1 task check
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

  // ═══ AUTO VERIFY (Telegram types) ═══
  if (isAuto) {
    const isTelegramTask = task.link.startsWith('@') ||
      task.link.includes('t.me/') ||
      task.link.startsWith('-100')

    if (isTelegramTask) {
      try {
        const chatId = task.link.startsWith('http')
          ? task.link.replace('https://t.me/', '@')
          : task.link

        const result = await tg('getChatMember', {
          chat_id: chatId,
          user_id: Number(user.telegramId)
        })

        if (!result.ok) {
          return NextResponse.json({
            ok: false,
            error: 'verify_failed',
            message: result.description || 'Telegram API error'
          })
        }

        const status = result.result?.status
        if (status === 'left' || status === 'kicked') {
          return NextResponse.json({
            ok: false,
            error: 'not_joined',
            message: 'আপনি এখনো join করেননি'
          })
        }

        // ✅ Instantly approve + pay
        const comp = await prisma.taskCompletion.create({
          data: {
            userId: user.id,
            taskId,
            status: 'approved',
            proof: 'auto-verified',
            reward,
            adminCut: task.adminCut
          }
        })

        // Add money
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
          reward,
          completionId: comp.id
        })
      } catch (e: any) {
        // API fail → escalate to admin
        const comp = await prisma.taskCompletion.create({
          data: {
            userId: user.id,
            taskId,
            status: 'pending',
            proof: 'auto-verify-failed: ' + (e.message || 'unknown'),
            reward,
            adminCut: task.adminCut,
            escalated: true
          }
        })

        await notifyAdmins(user, task, reward, 'escalated')

        return NextResponse.json({
          ok: true,
          escalated: true,
          message: 'Auto verify fail — admin manually check করবেন',
          completionId: comp.id
        })
      }
    }
  }

  // ═══ MANUAL VERIFY (screenshot) ═══
  if (!proof || !proof.trim()) {
    return NextResponse.json({ ok: false, error: 'proof_required' }, { status: 400 })
  }

  const comp = await prisma.taskCompletion.create({
    data: {
      userId: user.id,
      taskId,
      status: 'pending',
      proof: proof.trim(),
      reward,
      adminCut: task.adminCut
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

async function notifyAdmins(user: any, task: any, reward: number, kind: string) {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { telegramId: true }
  })

  const emoji = kind === 'escalated' ? '🚨' : '📸'
  const title = kind === 'escalated' ? 'ESCALATED (Auto-verify failed)' : 'New Submission'

  for (const a of admins) {
    try {
      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text: `${emoji} <b>${title}</b>\n\n👤 ${user.firstName} (@${user.username || 'user'})\n🆔 <code>${user.telegramId}</code>\n📌 ${task.title}\n💰 $${reward}\n\n👉 Admin Panel → Approvals`,
        parse_mode: 'HTML'
      })
    } catch {}
  }
}
