import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { taskId, proof } = await req.json()
  if (!taskId || !proof) return NextResponse.json({ ok: false, error: 'missing' }, { status: 400 })

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || !task.isActive) return NextResponse.json({ ok: false, error: 'invalid task' })

  const existing = await prisma.taskCompletion.findUnique({
    where: { userId_taskId: { userId: user.id, taskId } }
  })
  if (existing) return NextResponse.json({ ok: false, error: 'already submitted' })

  const reward = +(task.reward * (1 - task.adminCut / 100)).toFixed(4)

  const comp = await prisma.taskCompletion.create({
    data: {
      userId: user.id,
      taskId,
      status: task.verifyType === 'auto' ? 'approved' : 'pending',
      proof,
      reward,
      adminCut: task.adminCut
    }
  })

  if (task.verifyType === 'auto') {
    await creditEarning(user.id, reward)
  } else {
    // Notify admins
    const admins = await prisma.user.findMany({ where: { isAdmin: true } })
    for (const a of admins) {
      try {
        await tg('sendMessage', {
          chat_id: a.telegramId.toString(),
          text: `📸 <b>New Task Submission</b>\n\n👤 ${user.firstName} (@${user.username || 'N/A'})\n📌 ${task.title}\n💰 $${reward}`,
          parse_mode: 'HTML'
        })
      } catch {}
    }
  }

  return NextResponse.json({ ok: true, completion: comp })
}

async function creditEarning(userId: bigint, amount: number) {
  const u = await prisma.user.findUnique({ where: { id: userId } })
  if (!u) return
  await prisma.user.update({
    where: { id: userId },
    data: {
      mainBalance: { increment: amount },
      totalEarned: { increment: amount }
    }
  })
  if (u.referrerId) {
    const setting = await prisma.setting.findUnique({ where: { key: 'referral_percent' } })
    const pct = parseFloat(setting?.value || '10')
    const comm = +(amount * pct / 100).toFixed(4)
    await prisma.user.update({
      where: { id: u.referrerId },
      data: {
        mainBalance: { increment: comm },
        totalEarned: { increment: comm }
      }
    })
  }
}
