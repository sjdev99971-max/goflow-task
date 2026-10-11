import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { validateInitData, isRecentAuth } from './telegram'

export type AuthUser = {
  id: bigint
  telegramId: bigint
  isAdmin: boolean
  isBanned: boolean
  firstName: string | null
  username: string | null
  mainBalance: number
  promoteBalance: number
}

/**
 * Authenticate request via Telegram initData header
 * Auto-creates user if not exists
 */
export async function authenticate(req: NextRequest): Promise<AuthUser | null> {
  const initData = req.headers.get('x-init-data') || ''
  const result = validateInitData(initData)
  if (!result.ok || !result.user) return null
  if (!isRecentAuth(result.authDate || 0)) return null

  const tgUser = result.user
  const telegramId = BigInt(tgUser.id)

  // Check if banned
  let user = await prisma.user.findUnique({ where: { telegramId } })

  if (!user) {
    // First user becomes admin if no admin exists
    const adminCount = await prisma.user.count({ where: { isAdmin: true } })
    const isFirstUser = adminCount === 0

    user = await prisma.user.create({
      data: {
        telegramId,
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        photoUrl: tgUser.photo_url || null,
        languageCode: tgUser.language_code || null,
        isAdmin: isFirstUser
      }
    })
  } else {
    // Update profile info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        photoUrl: tgUser.photo_url || null
      }
    })
  }

  if (user.isBanned) return null

  return {
    id: user.id,
    telegramId: user.telegramId,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    firstName: user.firstName,
    username: user.username,
    mainBalance: user.mainBalance,
    promoteBalance: user.promoteBalance
  }
}

export async function requireAdmin(req: NextRequest) {
  const user = await authenticate(req)
  if (!user || !user.isAdmin) return null
  return user
}
