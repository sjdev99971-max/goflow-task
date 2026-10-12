import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

    const q = req.nextUrl.searchParams.get('q') || ''
    const where: any = {}

    if (q) {
      const ors: any[] = [
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } }
      ]
      if (/^\d+$/.test(q)) {
        try { ors.push({ telegramId: BigInt(q) }) } catch {}
      }
      where.OR = ors
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 100
    })

    return NextResponse.json({
      ok: true,
      users: users.map(u => ({
        id: String(u.id),
        telegramId: String(u.telegramId),
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        photoUrl: u.photoUrl,
        isAdmin: u.isAdmin,
        isDeveloper: u.isDeveloper,
        isBanned: u.isBanned,
        mainBalance: u.mainBalance,
        promoteBalance: u.promoteBalance,
        totalEarned: u.totalEarned,
        totalReferrals: u.totalReferrals,
        referrerId: u.referrerId ? String(u.referrerId) : null
      }))
    })
  } catch (e: any) {
    console.error('Admin users error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

    const { userId, action, amount } = await req.json()
    const id = BigInt(userId)

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ ok: false, error: 'not_found' })

    // Protect developer
    if (target.isDeveloper) {
      return NextResponse.json({ ok: false, error: 'developer_protected' })
    }

    if (action === 'ban') await prisma.user.update({ where: { id }, data: { isBanned: true } })
    else if (action === 'unban') await prisma.user.update({ where: { id }, data: { isBanned: false } })
    else if (action === 'makeAdmin') await prisma.user.update({ where: { id }, data: { isAdmin: true, promotedBy: admin.telegramId, promotedAt: new Date() } })
    else if (action === 'removeAdmin') await prisma.user.update({ where: { id }, data: { isAdmin: false } })
    else if (action === 'addBalance') await prisma.user.update({ where: { id }, data: { mainBalance: { increment: Number(amount) } } })
    else if (action === 'subBalance') await prisma.user.update({ where: { id }, data: { mainBalance: { decrement: Number(amount) } } })
    else if (action === 'addPromote') await prisma.user.update({ where: { id }, data: { promoteBalance: { increment: Number(amount) } } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
