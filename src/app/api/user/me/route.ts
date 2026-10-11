import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  const full = await prisma.user.findUnique({ where: { id: user.id } })
  return NextResponse.json({ ok: true, user: serialize(full) })
}

function serialize(u: any) {
  return {
    ...u,
    id: String(u.id),
    telegramId: String(u.telegramId),
    referrerId: u.referrerId ? String(u.referrerId) : null
  }
}
