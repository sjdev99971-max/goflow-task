import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const tasks = await prisma.task.findMany({ orderBy: { id: 'desc' }, take: 200 })
  return NextResponse.json({ ok: true, tasks })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const body = await req.json()
  const { type, title, description, link, reward, adminCut, verifyType } = body

  if (!type || !title || !link || !reward) {
    return NextResponse.json({ ok: false, error: 'missing_fields' })
  }

  // 🛡️ Server-side: Telegram tasks require bot admin
  const TG_TYPES = ['join_chat', 'bot', 'group']
  if (TG_TYPES.includes(type)) {
    try {
      const meRes = await tg('getMe')
      if (!meRes.ok) return NextResponse.json({ ok: false, error: 'bot_api_error' })

      const check = await tg('getChatMember', {
        chat_id: link,
        user_id: meRes.result.id
      })

      if (!check.ok) {
        return NextResponse.json({
          ok: false,
          error: 'bot_not_admin',
          message: 'Bot এই channel এ admin না — task তৈরি করার আগে admin বানান'
        })
      }

      const s = check.result?.status
      if (s !== 'administrator' && s !== 'creator') {
        return NextResponse.json({
          ok: false,
          error: 'bot_not_admin',
          message: 'Bot কে এই channel এর admin বানাতে হবে'
        })
      }
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: 'verify_failed', message: e.message })
    }
  }

  const task = await prisma.task.create({
    data: {
      type,
      title,
      description: description || null,
      link: link.trim(),
      reward: parseFloat(reward),
      adminCut: parseFloat(adminCut || 0),
      verifyType: TG_TYPES.includes(type) ? 'auto' : (verifyType || 'manual')
    }
  })
  return NextResponse.json({ ok: true, task })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const { id, action } = await req.json()
  if (action === 'toggle') {
    const t = await prisma.task.findUnique({ where: { id } })
    await prisma.task.update({ where: { id }, data: { isActive: !t!.isActive } })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await req.json()
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
