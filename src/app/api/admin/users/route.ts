import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const q = req.nextUrl.searchParams.get('q') || ''
  const users = await prisma.user.findMany({
    where: q ? {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        ...(isNaN(Number(q)) ? [] : [{ telegramId: BigInt(q) }])
      ]
    } : undefined,
    orderBy: { id: 'desc' },
    take: 100
  })

  return NextResponse.json({
    ok: true,
    users: users.map(u => ({ ...u, id: String(u.id), telegramId: String(u.telegramId), referrerId: u.referrerId ? String(u.referrerId) : null }))
  })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const { userId, action, amount } = await req.json()
  const id = BigInt(userId)

  if (action === 'ban') await prisma.user.update({ where: { id }, data: { isBanned: true } })
  else if (action === 'unban') await prisma.user.update({ where: { id }, data: { isBanned: false } })
  else if (action === 'makeAdmin') await prisma.user.update({ where: { id }, data: { isAdmin: true } })
  else if (action === 'removeAdmin') await prisma.user.update({ where: { id }, data: { isAdmin: false } })
  else if (action === 'addBalance') await prisma.user.update({ where: { id }, data: { mainBalance: { increment: amount } } })
  else if (action === 'subBalance') await prisma.user.update({ where: { id }, data: { mainBalance: { decrement: amount } } })
  else if (action === 'addPromote') await prisma.user.update({ where: { id }, data: { promoteBalance: { increment: amount } } })

  return NextResponse.json({ ok: true })
}
