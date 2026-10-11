import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('key')
  if (secret !== 'shanto-debug-2026') {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
  const bt = process.env.BOT_TOKEN || ''
  const db = process.env.DATABASE_URL || ''
  return NextResponse.json({
    BOT_TOKEN_set: !!bt,
    BOT_TOKEN_prefix: bt ? bt.substring(0, 12) : '',
    BOT_TOKEN_suffix: bt ? bt.substring(bt.length - 4) : '',
    DATABASE_URL_set: !!db,
    DATABASE_URL_prefix: db ? db.substring(0, 30) : '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '<not set>',
    BOT_USERNAME: process.env.BOT_USERNAME || '<not set>',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  })
}
