import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  const u = await prisma.user.findUnique({ where: { id: user.id } })
  return NextResponse.json({
    ok: true,
    mainBalance: u!.mainBalance,
    promoteBalance: u!.promoteBalance,
    totalEarned: u!.totalEarned,
    totalWithdrawn: u!.totalWithdrawn
  })
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { amount } = await req.json()
  const amt = parseFloat(amount)
  if (!amt || amt <= 0) return NextResponse.json({ ok: false, error: 'invalid amount' })

  const u = await prisma.user.findUnique({ where: { id: user.id } })
  if (u!.mainBalance < amt) return NextResponse.json({ ok: false, error: 'insufficient' })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mainBalance: { decrement: amt },
      promoteBalance: { increment: amt }
    }
  })
  return NextResponse.json({ ok: true })
}
