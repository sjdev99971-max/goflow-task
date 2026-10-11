import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TASK_TYPES: Record<string, string> = {
  join_chat: '📢 Join Chat',
  bot: '🤖 Massage Bot',
  view_post: '📄 View Post',
  micro: '🧑‍💻 Micro Task',
  x: '🚀 Follow X',
  tiktok: '🚨 TikTok',
  youtube: '🖇️ Youtube',
  instagram: '🕐 Instagram'
}

async function getMainMenu(botUsername: string) {
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.vercel.app'
  return {
    inline_keyboard: [
      [{ text: '🚀 Open App', web_app: { url: `${webAppUrl}/app` } }],
      [{ text: '💸 Earnings', web_app: { url: `${webAppUrl}/app?tab=tasks` } }],
      [{ text: '🚀 Promote Now', web_app: { url: `${webAppUrl}/app?page=promote` } }],
      [{ text: '👭 Refer & Earn', web_app: { url: `${webAppUrl}/app?tab=rank` } }],
      [{ text: '📤 Withdraw', web_app: { url: `${webAppUrl}/app?page=withdraw` } }],
      [{ text: '🖇️ 24/7 Support', url: `https://t.me/${await getSetting('support_username')}` }]
    ]
  }
}

async function checkJoined(channels: string[], userId: number): Promise<string | null> {
  if (!channels.length) return null
  for (const ch of channels) {
    try {
      const res = await tg('getChatMember', { chat_id: ch, user_id: userId })
      if (!res.ok) return ch
      const status = res.result?.status
      if (status === 'left' || status === 'kicked') return ch
    } catch {
      return ch
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    // Handle message
    if (update.message) {
      const msg = update.message
      const chatId = msg.chat.id
      const from = msg.from
      const text = msg.text || ''

      if (text.startsWith('/start')) {
        // Parse referral
        const parts = text.split(' ')
        let referrerTelegramId: bigint | null = null
        if (parts[1]?.startsWith('ref_')) {
          try {
            referrerTelegramId = BigInt(parts[1].replace('ref_', ''))
            if (referrerTelegramId === BigInt(from.id)) referrerTelegramId = null
          } catch { referrerTelegramId = null }
        }

        // Upsert user
        const existing = await prisma.user.findUnique({ where: { telegramId: BigInt(from.id) } })
        if (!existing) {
          const adminCount = await prisma.user.count({ where: { isAdmin: true } })
          let referrerId: bigint | null = null
          if (referrerTelegramId) {
            const ref = await prisma.user.findUnique({ where: { telegramId: referrerTelegramId } })
            if (ref) {
              referrerId = ref.id
              await prisma.user.update({
                where: { id: ref.id },
                data: { totalReferrals: { increment: 1 } }
              })
            }
          }
          await prisma.user.create({
            data: {
              telegramId: BigInt(from.id),
              username: from.username || null,
              firstName: from.first_name || null,
              lastName: from.last_name || null,
              languageCode: from.language_code || null,
              referrerId,
              isAdmin: adminCount === 0
            }
          })
        }

        // Force channels check
        const forceStr = await getSetting('force_channels')
        const forceChannels = forceStr.split(',').map(s => s.trim()).filter(Boolean)

        const notJoined = await checkJoined(forceChannels, from.id)
        if (notJoined && forceChannels.length) {
          const kb = {
            inline_keyboard: [
              ...forceChannels.map(ch => ([{
                text: `📢 Join ${ch}`,
                url: ch.startsWith('-') ? `https://t.me/c/${ch.replace('-100', '')}` : `https://t.me/${ch.replace('@', '')}`
              }])),
              [{ text: '✅ Verify', callback_data: 'verify_join' }]
            ]
          }
          await tg('sendMessage', {
            chat_id: chatId,
            text: '⚠️ <b>Menu Locked!</b>\n\nনিচের সব চ্যানেল/গ্রুপে জয়েন করে Verify চাপুন।',
            parse_mode: 'HTML',
            reply_markup: kb
          })
          return NextResponse.json({ ok: true })
        }

        const botUsername = (await tg('getMe')).result?.username || ''
        const welcome = await getSetting('welcome_text')
        await tg('sendMessage', {
          chat_id: chatId,
          text: welcome,
          parse_mode: 'HTML',
          reply_markup: await getMainMenu(botUsername)
        })
      }
    }

    // Handle callback queries
    if (update.callback_query) {
      const cb = update.callback_query
      const chatId = cb.message.chat.id
      const fromId = cb.from.id

      if (cb.data === 'verify_join') {
        const forceStr = await getSetting('force_channels')
        const forceChannels = forceStr.split(',').map(s => s.trim()).filter(Boolean)
        const notJoined = await checkJoined(forceChannels, fromId)

        if (notJoined) {
          await tg('answerCallbackQuery', {
            callback_query_id: cb.id,
            text: '❌ এখনো সব চ্যানেলে জয়েন করা হয়নি!',
            show_alert: true
          })
        } else {
          await tg('answerCallbackQuery', { callback_query_id: cb.id, text: '✅ Verified!' })
          const botUsername = (await tg('getMe')).result?.username || ''
          await tg('editMessageText', {
            chat_id: chatId,
            message_id: cb.message.message_id,
            text: '✅ Verification Successful!\n\n🚀 এখন App ওপেন করে কাজ শুরু করুন।',
            parse_mode: 'HTML',
            reply_markup: await getMainMenu(botUsername)
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook active' })
}
