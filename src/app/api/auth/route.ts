import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateInitData, isRecentAuth } from '@/lib/telegram'
import { getSetting, setSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // initData: header OR body
    let initData = req.headers.get('x-init-data') || ''
    if (!initData) {
      try {
        const body = await req.json()
        initData = body?.initData || ''
      } catch {}
    }

    if (!initData) {
      return NextResponse.json({ ok: false, error: 'no_initdata' }, { status: 401 })
    }

    const result = validateInitData(initData)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: 'invalid_hash', len: initData.length }, { status: 401 })
    }
    if (!result.user) {
      return NextResponse.json({ ok: false, error: 'no_user_in_initdata' }, { status: 401 })
    }
    if (!isRecentAuth(result.authDate || 0)) {
      return NextResponse.json({ ok: false, error: 'auth_too_old', authDate: result.authDate }, { status: 401 })
    }

    const tgUser = result.user
    const telegramId = BigInt(tgUser.id)

    let user = await prisma.user.findUnique({ where: { telegramId } })

    if (!user) {
      const adminCount = await prisma.user.count({ where: { isAdmin: true } })
      const isFirstUser = adminCount === 0

      user = await prisma.user.create({
        data: {
          telegramId,
          username: tgUser.username || null,
          firstName: tgUser.first_name || null,
          lastName: tgUser.last_name || null,
          photoUrl: tgUser.photo_url || null,
          languageCode: tgUser.language_code || null,
          isAdmin: isFirstUser
        }
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: tgUser.username || null,
          firstName: tgUser.first_name || null,
          lastName: tgUser.last_name || null,
          photoUrl: tgUser.photo_url || null
        }
      })
    }

    if (user.isBanned) {
      return NextResponse.json({ ok: false, error: 'banned' }, { status: 403 })
    }

    // Auto-assign Developer (first user) or ensure existing dev has flags
    const devId = await getSetting('developer_id')
    if (!devId) {
      await setSetting('developer_id', telegramId.toString())
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true, isDeveloper: true }
      })
      user.isAdmin = true
    } else if (devId === telegramId.toString() && !user.isDeveloper) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true, isDeveloper: true }
      })
      user.isAdmin = true
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: String(user.id),
        telegramId: String(user.telegramId),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        isAdmin: user.isAdmin,
        isDeveloper: user.isDeveloper,
        mainBalance: user.mainBalance,
        promoteBalance: user.promoteBalance,
        totalEarned: user.totalEarned,
        totalReferrals: user.totalReferrals
      }
    })
  } catch (err: any) {
    console.error('Auth error:', err)
    return NextResponse.json({
      ok: false,
      error: 'exception',
      message: err?.message || String(err),
      code: err?.code || null
    }, { status: 500 })
  }
}
