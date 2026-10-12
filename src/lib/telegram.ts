import crypto from 'crypto'

const TOKENS = [
  process.env.BOT_TOKEN || '',
  process.env.BOT_TOKEN_PROD || '',
  process.env.BOT_TOKEN_DEV || '',
  '8992158408:AAHCn-xLisub4SYMNtd6nV8VcgJkw_z-3TU', // PROD fallback
  '8926807926:AAFYDCHhKvsaaweNnYR4pi8xa695rHrynl8'  // DEV fallback
].filter(Boolean)

export const BOT_TOKEN = TOKENS[0] || ''
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

export function validateInitData(initData: string): {
  ok: boolean
  user?: any
  authDate?: number
  usedToken?: string
} {
  try {
    if (!initData) return { ok: false }
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return { ok: false }

    params.delete('hash')
    const dataCheckString = Array.from(params.entries())
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n')

    // Try each token
    for (const token of TOKENS) {
      try {
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
        const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

        if (computedHash === hash) {
          const userStr = params.get('user')
          const authDate = parseInt(params.get('auth_date') || '0')
          if (!userStr) return { ok: false }
          return {
            ok: true,
            user: JSON.parse(userStr),
            authDate,
            usedToken: token.substring(0, 15)
          }
        }
      } catch {}
    }

    return { ok: false }
  } catch {
    return { ok: false }
  }
}

export function isRecentAuth(authDate: number, maxAgeSec = 86400 * 7) {
  return Date.now() / 1000 - authDate < maxAgeSec
}
