import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function checkMembership(userId: number): Promise<{ channels: string[]; joined: Record<string, boolean>; allJoined: boolean }> {
  const raw = await getSetting('force_channels')
  const channels = raw.split(',').map(s => s.trim()).filter(Boolean)

  if (!channels.length) {
    return { channels: [], joined: {}, allJoined: true }
  }

  const joined: Record<string, boolean> = {}
  for (const ch of channels) {
    try {
      const r = await tg('getChatMember', { chat_id: ch, user_id: userId })
      if (r.ok) {
        const s = r.result?.status
        joined[ch] = s !== 'left' && s !== 'kicked'
      } else {
        joined[ch] = false
      }
    } catch {
      joined[ch] = false
    }
  }
  const allJoined = channels.every(c => joined[c])
  return { channels, joined, allJoined }
}

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const result = await checkMembership(Number(user.telegramId))
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const result = await checkMembership(Number(user.telegramId))
  return NextResponse.json({ ok: true, ...result })
}
