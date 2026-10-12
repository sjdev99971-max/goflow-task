import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function validateWithToken(initData: string, token: string) {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return { ok: false, reason: 'no_hash_in_initdata' }

    params.delete('hash')
    const entries = Array.from(params.entries()).sort()
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    return {
      ok: computedHash === hash,
      receivedHash: hash.substring(0, 16) + '...',
      computedHash: computedHash.substring(0, 16) + '...',
      fullMatch: computedHash === hash,
      keysInData: entries.map(([k]) => k)
    }
  } catch (e: any) {
    return { ok: false, reason: e.message }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const initData = body?.initData || ''

    if (!initData) {
      return NextResponse.json({ ok: false, error: 'no_initdata_provided' })
    }

    // Parse env values
    const envBT = process.env.BOT_TOKEN || ''
    const envBTP = process.env.BOT_TOKEN_PROD || ''
    const envBTD = process.env.BOT_TOKEN_DEV || ''

    const FALLBACK_PROD = '8992158408:AAHCn-xLisub4SYMNtd6nV8VcgJkw_z-3TU'
    const FALLBACK_DEV = '8926807926:AAFYDCHhKvsaaweNnYR4pi8xa695rHrynl8'

    const tokensToTry = [
      { name: 'env.BOT_TOKEN', token: envBT },
      { name: 'env.BOT_TOKEN_PROD', token: envBTP },
      { name: 'env.BOT_TOKEN_DEV', token: envBTD },
      { name: 'fallback.PROD', token: FALLBACK_PROD },
      { name: 'fallback.DEV', token: FALLBACK_DEV }
    ].filter(t => t.token)

    const results: any[] = []

    for (const t of tokensToTry) {
      const r = validateWithToken(initData, t.token)
      results.push({
        source: t.name,
        tokenPrefix: t.token.substring(0, 15),
        tokenSuffix: t.token.substring(t.token.length - 4),
        ...r
      })
    }

    // Parse initData structure
    const params = new URLSearchParams(initData)
    const parsed: any = {}
    for (const [k, v] of params.entries()) {
      parsed[k] = v.length > 60 ? v.substring(0, 60) + '...' : v
    }

    return NextResponse.json({
      ok: true,
      initDataLength: initData.length,
      initDataFirst100: initData.substring(0, 100),
      initDataLast50: initData.substring(initData.length - 50),
      parsedKeys: Object.keys(parsed),
      parsedValues: parsed,
      tokenResults: results,
      matchedWith: results.find(r => r.fullMatch)?.source || null
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
