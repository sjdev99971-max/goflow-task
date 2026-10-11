import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLATFORMS = ['google', 'github', 'twitter', 'youtube', 'tiktok', 'instagram']

// GET: list linked accounts
export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const accounts = await prisma.userAccount.findMany({
    where: { userId: user.id },
    orderBy: { platform: 'asc' }
  })

  return NextResponse.json({
    ok: true,
    accounts: accounts.map(a => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      email: a.email,
      profileUrl: a.profileUrl,
      isVerified: a.isVerified
    }))
  })
}

// POST: add or update account
export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await req.json()
  const { platform, username, email, profileUrl } = body

  if (!platform || !PLATFORMS.includes(platform)) {
    return NextResponse.json({ ok: false, error: 'invalid_platform' }, { status: 400 })
  }
  if (!username || username.trim().length < 2) {
    return NextResponse.json({ ok: false, error: 'username_required' }, { status: 400 })
  }

  const account = await prisma.userAccount.upsert({
    where: { userId_platform: { userId: user.id, platform } },
    create: {
      userId: user.id,
      platform,
      username: username.trim(),
      email: email?.trim() || null,
      profileUrl: profileUrl?.trim() || null
    },
    update: {
      username: username.trim(),
      email: email?.trim() || null,
      profileUrl: profileUrl?.trim() || null
    }
  })

  return NextResponse.json({ ok: true, account })
}

// DELETE: unlink
export async function DELETE(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { platform } = await req.json()
  if (!platform) return NextResponse.json({ ok: false }, { status: 400 })

  await prisma.userAccount.deleteMany({
    where: { userId: user.id, platform }
  })

  return NextResponse.json({ ok: true })
}
