import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateInitData } from '@/lib/telegram'
import { setSetting, getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Auto-init: first user becomes Developer if none set
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const initData = body?.initData
    if (!initData) return NextResponse.json({ ok: false }, { status: 400 })

    const result = validateInitData(initData)
    if (!result.ok || !result.user) return NextResponse.json({ ok: false }, { status: 401 })

    const telegramId = BigInt(result.user.id)
    const existingDevId = await getSetting('developer_id')

    // If no developer set yet, first initData user becomes developer
    if (!existingDevId) {
      await setSetting('developer_id', telegramId.toString())
      await prisma.user.updateMany({
        where: { telegramId },
        data: { isAdmin: true, isDeveloper: true }
      })
      return NextResponse.json({ ok: true, assigned: true, developerId: telegramId.toString() })
    }

    return NextResponse.json({ ok: true, developerId: existingDevId })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  const id = await getSetting('developer_id')
  return NextResponse.json({ ok: true, developerId: id || null })
}
