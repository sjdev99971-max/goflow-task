import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tg } from '@/lib/telegram'
import { getSetting } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getMainMenu() {
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shanto13163.jahid.one'
  const support = await getSetting('support_username')
  return {
    inline_keyboard: [
      [{ text: '🚀 Open GoFlow App', web_app: { url: `${webAppUrl}/app` } }],
      [
        { text: '💸 Earn Now', web_app: { url: `${webAppUrl}/app?tab=tasks` } },
        { text: '💰 Balance', web_app: { url: `${webAppUrl}/app?tab=wallet` } }
      ],
      [
        { text: '🚀 Promote', web_app: { url: `${webAppUrl}/app?page=promote` } },
        { text: '👭 Refer', web_app: { url: `${webAppUrl}/app?tab=rank` } }
      ],
      [
        { text: '🏆 Leaderboard', web_app: { url: `${webAppUrl}/app?tab=rank` } },
        { text: '📤 Withdraw', web_app: { url: `${webAppUrl}/app?page=withdraw` } }
      ],
      [{ text: '🖇️ 24/7 Support', url: `https://t.me/${support}` }]
    ]
  }
}

async function checkJoined(channels: string[], userId: number): Promise<string | null> {
  if (!channels.length) return null
  for (const ch of channels) {
    try {
      const res = await tg('getChatMember', { chat_id: ch, user_id: userId })
      if (!res.ok) return ch
      const s = res.result?.status
      if (s === 'left' || s === 'kicked') return ch
    } catch { return ch }
  }
  return null
}

async function sendWelcome(chatId: number, firstName: string, botUsername: string) {
  const support = await getSetting('support_username')
  const text = `╔══════════════════════════╗
   🦊 <b>G O F L O W   T A S K</b>
╚══════════════════════════╝

👋 Hey <b>${firstName}</b>, welcome aboard!

💎 <b>About GoFlow</b>
━━━━━━━━━━━━━━━━━━━━━━━
🚀 Complete simple tasks
💰 Earn real USDT instantly
📤 Withdraw from $0.20
🎁 Daily rewards & bonuses
👭 Lifetime referral income

⚡ <b>How it works?</b>
━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Tap "Open App" below
2️⃣ Pick any task
3️⃣ Complete → Get paid
4️⃣ Withdraw to Binance/TON

🎯 <b>Ready to earn?</b>
Tap the button below 👇

━━━━━━━━━━━━━━━━━━━━━━━
💬 Support: @${support}
🦊 By @DEVELOPER_JAHID_BHAI`

  await tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: await getMainMenu()
  })
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    // ─── Message ───
    if (update.message) {
      const msg = update.message
      const chatId = msg.chat.id
      const from = msg.from
      const text = msg.text || ''
      const firstName = from.first_name || 'Friend'

      // ═══ /start ═══
      if (text.startsWith('/start')) {
        const parts = text.split(' ')
        let referrerTelegramId: bigint | null = null
        if (parts[1]?.startsWith('ref_')) {
          try {
            referrerTelegramId = BigInt(parts[1].replace('ref_', ''))
            if (referrerTelegramId === BigInt(from.id)) referrerTelegramId = null
          } catch { referrerTelegramId = null }
        }

        const existing = await prisma.user.findUnique({ where: { telegramId: BigInt(from.id) } })

        if (!existing) {
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
          const adminCount = await prisma.user.count({ where: { isAdmin: true } })
          await prisma.user.create({
            data: {
              telegramId: BigInt(from.id),
              username: from.username || null,
              firstName: from.first_name || null,
              lastName: from.last_name || null,
              languageCode: from.language_code || null,
              referrerId,
              isAdmin: adminCount === 0,
              isDeveloper: adminCount === 0
            }
          })
        }

        const me = await tg('getMe')
        const botUsername = me?.result?.username || 'goflowtask_bot'

        await sendWelcome(chatId, firstName, botUsername)
        return NextResponse.json({ ok: true })
      }

      // ═══ /app ═══
      if (text === '/app' || text === '/menu' || text === '/play') {
        const me = await tg('getMe')
        await tg('sendMessage', {
          chat_id: chatId,
          text: `🚀 <b>Ready to earn, ${firstName}?</b>\n\nTap below to open the app 👇`,
          parse_mode: 'HTML',
          reply_markup: await getMainMenu()
        })
        return NextResponse.json({ ok: true })
      }

      // ═══ /balance ═══
      if (text === '/balance') {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(from.id) } })
        const balance = user?.mainBalance || 0
        const earned = user?.totalEarned || 0
        await tg('sendMessage', {
          chat_id: chatId,
          text: `💰 <b>Your Balance</b>\n\n💵 Main: <b>$${balance.toFixed(4)}</b>\n📊 Total Earned: <b>$${earned.toFixed(4)}</b>\n\nOpen app to see more 👇`,
          parse_mode: 'HTML',
          reply_markup: await getMainMenu()
        })
        return NextResponse.json({ ok: true })
      }

      // ═══ /refer ═══
      if (text === '/refer') {
        const me = await tg('getMe')
        const botUsername = me?.result?.username || 'goflowtask_bot'
        const link = `https://t.me/${botUsername}?start=ref_${from.id}`
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(from.id) } })
        await tg('sendMessage', {
          chat_id: chatId,
          text: `👭 <b>Refer & Earn</b>\n\n🔗 Your link:\n<code>${link}</code>\n\n👥 Referrals: <b>${user?.totalReferrals || 0}</b>\n💰 Commission: <b>10% lifetime</b>\n\nShare & earn forever! 🚀`,
          parse_mode: 'HTML',
          reply_markup: await getMainMenu()
        })
        return NextResponse.json({ ok: true })
      }

      // ═══ /help ═══
      if (text === '/help' || text === '/support') {
        const support = await getSetting('support_username')
        await tg('sendMessage', {
          chat_id: chatId,
          text: `🖇️ <b>Need Help?</b>\n\nContact: @${support}\n\nWe reply 24/7 ✅`,
          parse_mode: 'HTML',
          reply_markup: await getMainMenu()
        })
        return NextResponse.json({ ok: true })
      }

      // ═══ Any other text → auto welcome ═══
      await sendWelcome(chatId, firstName, 'goflowtask_bot')
      return NextResponse.json({ ok: true })
    }

    // ─── Callback ───
    if (update.callback_query) {
      const cb = update.callback_query
      if (cb.data === 'verify_join') {
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: '✅ Verified!' })
      } else {
        await tg('answerCallbackQuery', { callback_query_id: cb.id })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook active', time: new Date().toISOString() })
}
