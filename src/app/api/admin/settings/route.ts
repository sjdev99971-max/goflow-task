import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllSettings, setSetting } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const settings = await getAllSettings()
  return NextResponse.json({ ok: true, settings })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const body = await req.json()
  for (const [k, v] of Object.entries(body)) {
    await setSetting(k, String(v))
  }
  return NextResponse.json({ ok: true })
}
