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

  const { taskId, proof, image } = await req.json()
  if (!taskId) return NextResponse.json({ ok: false, error: 'task_required' }, { status: 400 })

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || !task.isActive) return NextResponse.json({ ok: false, error: 'invalid_task' })

  const existing = await prisma.taskCompletion.findUnique({
    where: { userId_taskId: { userId: user.id, taskId } }
  })
  if (existing) return NextResponse.json({ ok: false, error: 'already_done', status: existing.status })

  const reward = +(task.reward * (1 - task.adminCut / 100)).toFixed(4)
  const isAuto = task.verifyType === 'auto' || AUTO_TYPES.includes(task.type)

  // Auto verify
  if (isAuto && !image) {
    const isTg = task.link.startsWith('@') || task.link.includes('t.me/') || task.link.startsWith('-100')
    if (isTg) {
      try {
        const chatId = task.link.startsWith('http') ? task.link.replace('https://t.me/', '@') : task.link
        const r = await tg('getChatMember', { chat_id: chatId, user_id: Number(user.telegramId) })
        if (r.ok) {
          const s = r.result?.status
          if (s === 'left' || s === 'kicked') {
            return NextResponse.json({ ok: false, error: 'not_joined', message: 'আপনি এখনো join করেননি' })
          }
          await prisma.taskCompletion.create({
            data: { userId: user.id, taskId, status: 'approved', proof: 'auto-verified', reward, adminCut: task.adminCut }
          })
          await prisma.user.update({
            where: { id: user.id },
            data: { mainBalance: { increment: reward }, totalEarned: { increment: reward } }
          })
          const u = await prisma.user.findUnique({ where: { id: user.id } })
          if (u?.referrerId) {
            const pct = parseFloat(await getSetting('referral_percent')) || 10
            const comm = +(reward * pct / 100).toFixed(4)
            await prisma.user.update({
              where: { id: u.referrerId },
              data: { mainBalance: { increment: comm }, totalEarned: { increment: comm } }
            })
          }
          return NextResponse.json({ ok: true, autoApproved: true, reward })
        }
      } catch (e: any) {
        const comp = await prisma.taskCompletion.create({
          data: { userId: user.id, taskId, status: 'pending', proof: 'auto-fail: ' + (e.message || ''), reward, adminCut: task.adminCut, escalated: true }
        })
        await notifyAdmins(user, task, reward, comp.id, 'escalated')
        return NextResponse.json({ ok: true, escalated: true })
      }
    }
  }

  // Manual — build proof string
  let proofStr = (proof || '').trim()
  if (image) proofStr = (proofStr ? proofStr + ' | ' : '') + '[IMAGE]' + image.substring(0, 500)
  if (!proofStr) return NextResponse.json({ ok: false, error: 'proof_required' })

  const comp = await prisma.taskCompletion.create({
    data: { userId: user.id, taskId, status: 'pending', proof: proofStr, reward, adminCut: task.adminCut }
  })

  await notifyAdmins(user, task, reward, comp.id, 'pending')
  return NextResponse.json({ ok: true, pending: true, completionId: comp.id })
}

async function notifyAdmins(user: any, task: any, reward: number, compId: number, kind: string) {
  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { telegramId: true } })
  const emoji = kind === 'escalated' ? '🚨' : '📸'
  const title = kind === 'escalated' ? 'ESCALATED' : 'New Submission'
  for (const a of admins) {
    try {
      await tg('sendMessage', {
        chat_id: a.telegramId.toString(),
        text: `${emoji} <b>${title}</b>\n\n👤 ${user.firstName} (@${user.username || 'user'})\n📌 ${task.title}\n💰 $${reward}\n\n👉 Admin Panel → Approvals`,
        parse_mode: 'HTML'
      })
    } catch {}
  }
}
