import crypto from 'crypto'

export const BOT_TOKEN = process.env.BOT_TOKEN || ''
export const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function tg(method: string, payload?: any) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store'
  })
  return res.json()
}

/**
 * Validate Telegram WebApp initData using HMAC-SHA256
 * Returns user object if valid, null otherwise
 */
export function validateInitData(initData: string): {
  ok: boolean
  user?: any
  authDate?: number
} {
  try {
    if (!initData || !BOT_TOKEN) return { ok: false }
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return { ok: false }

    params.delete('hash')
    const dataCheckString = Array.from(params.entries())
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (computedHash !== hash) return { ok: false }

    const userStr = params.get('user')
    const authDate = parseInt(params.get('auth_date') || '0')
    if (!userStr) return { ok: false }

    return { ok: true, user: JSON.parse(userStr), authDate }
  } catch {
    return { ok: false }
  }
}

export function isRecentAuth(authDate: number, maxAgeSec = 86400) {
  return Date.now() / 1000 - authDate < maxAgeSec
}
