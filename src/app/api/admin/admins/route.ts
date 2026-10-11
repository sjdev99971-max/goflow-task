import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSetting } from '@/lib/settings'
import { tg } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: list all admins
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const devId = await getSetting('developer_id')
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    orderBy: [{ isDeveloper: 'desc' }, { promotedAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      telegramId: true,
      firstName: true,
      username: true,
      photoUrl: true,
      isAdmin: true,
      isDeveloper: true,
      promotedBy: true,
      promotedAt: true
    }
  })

  return NextResponse.json({
    ok: true,
    developerId: devId,
    currentAdminTelegramId: admin.telegramId.toString(),
    admins: admins.map(a => ({
      ...a,
      id: String(a.id),
      telegramId: String(a.telegramId),
      promotedBy: a.promotedBy ? String(a.promotedBy) : null
    }))
  })
}

// POST: promote/demote
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const { action, telegramId } = await req.json()
  if (!action || !telegramId) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } })
  if (!target) return NextResponse.json({ ok: false, error: 'user_not_found' })

  const devId = await getSetting('developer_id')

  // 🛡️ Developer can never be touched
  if (target.telegramId.toString() === devId) {
    return NextResponse.json({ ok: false, error: 'developer_protected' })
  }

  // Get current admin user
  const me = await prisma.user.findUnique({ where: { telegramId: admin.telegramId } })

  if (action === 'promote') {
    if (target.isAdmin) return NextResponse.json({ ok: false, error: 'already_admin' })
    await prisma.user.update({
      where: { id: target.id },
      data: {
        isAdmin: true,
        promotedBy: admin.telegramId,
        promotedAt: new Date()
      }
    })
    try {
      await tg('sendMessage', {
        chat_id: target.telegramId.toString(),
        text: `🎉 <b>Congratulations!</b>\n\nYou've been promoted to Admin by @${admin.username || 'admin'}.`,
        parse_mode: 'HTML'
      })
    } catch {}
    return NextResponse.json({ ok: true })

  } else if (action === 'demote') {
    if (!target.isAdmin) return NextResponse.json({ ok: false, error: 'not_admin' })

    // 🛡️ Hierarchy rule: can only demote admins YOU promoted
    const isDeveloper = me?.isDeveloper || admin.telegramId.toString() === devId
    const isOwnPromotion = target.promotedBy?.toString() === admin.telegramId.toString()

    if (!isDeveloper && !isOwnPromotion) {
      return NextResponse.json({
        ok: false,
        error: 'hierarchy_forbidden',
        message: 'শুধু আপনি যে admin কে promote করেছেন, তাকেই demote করতে পারবেন।'
      })
    }

    await prisma.user.update({
      where: { id: target.id },
      data: {
        isAdmin: false,
        promotedBy: null,
        promotedAt: null
      }
    })
    try {
      await tg('sendMessage', {
        chat_id: target.telegramId.toString(),
        text: `⚠️ Your admin access has been removed.`,
        parse_mode: 'HTML'
      })
    } catch {}
    return NextResponse.json({ ok: true })

  } else {
    return NextResponse.json({ ok: false, error: 'invalid_action' })
  }
}
