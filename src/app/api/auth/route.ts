import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const full = await prisma.user.findUnique({ where: { id: user.id } })
  return NextResponse.json({
    ok: true,
    user: {
      id: String(full!.id),
      telegramId: String(full!.telegramId),
      firstName: full!.firstName,
      lastName: full!.lastName,
      username: full!.username,
      photoUrl: full!.photoUrl,
      isAdmin: full!.isAdmin,
      mainBalance: full!.mainBalance,
      promoteBalance: full!.promoteBalance,
      totalEarned: full!.totalEarned,
      totalReferrals: full!.totalReferrals
    }
  })
}
