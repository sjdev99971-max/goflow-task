import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { tg } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify that the bot is admin in a given channel/group
 * POST body: { channel: "@channel" | "-100xxx" }
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const { channel } = await req.json()
  if (!channel) return NextResponse.json({ ok: false, error: 'channel_required' })

  try {
    // Get bot info
    const meRes = await tg('getMe')
    if (!meRes.ok) {
      return NextResponse.json({ ok: false, error: 'bot_api_failed' })
    }
    const botId = meRes.result.id

    // Check bot membership in channel
    const res = await tg('getChatMember', {
      chat_id: channel,
      user_id: botId
    })

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: 'cannot_access',
        message: res.description || 'Channel খুঁজে পাওয়া যায়নি বা bot সেখানে নেই',
        botUsername: meRes.result.username,
        botId
      })
    }

    const status = res.result?.status
    const isAdmin = status === 'administrator' || status === 'creator'
    const canPostMessages = res.result?.can_post_messages !== false

    // Get chat info
    let chatTitle = ''
    let chatType = ''
    try {
      const chatRes = await tg('getChat', { chat_id: channel })
      if (chatRes.ok) {
        chatTitle = chatRes.result.title || chatRes.result.username || ''
        chatType = chatRes.result.type || ''
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      isAdmin,
      status,
      chatTitle,
      chatType,
      botUsername: meRes.result.username,
      botId,
      canPostMessages
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: 'exception',
      message: e.message || 'Failed'
    })
  }
}
