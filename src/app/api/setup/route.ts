import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SETUP_SECRET = 'shanto-setup-2026'

const SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS "User" (
    id BIGSERIAL PRIMARY KEY,
    "telegramId" BIGINT UNIQUE NOT NULL,
    username TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "languageCode" TEXT,
    "isAdmin" BOOLEAN DEFAULT false,
    "isBanned" BOOLEAN DEFAULT false,
    "isDeveloper" BOOLEAN DEFAULT false,
    "promotedBy" BIGINT,
    "promotedAt" TIMESTAMP,
    "mainBalance" DOUBLE PRECISION DEFAULT 0,
    "promoteBalance" DOUBLE PRECISION DEFAULT 0,
    "totalEarned" DOUBLE PRECISION DEFAULT 0,
    "totalWithdrawn" DOUBLE PRECISION DEFAULT 0,
    "referrerId" BIGINT,
    "totalReferrals" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_referrer ON "User"("referrerId")`,
  `CREATE INDEX IF NOT EXISTS idx_user_earned ON "User"("totalEarned")`,
  `CREATE INDEX IF NOT EXISTS idx_user_refs ON "User"("totalReferrals")`,
  `CREATE INDEX IF NOT EXISTS idx_user_tg ON "User"("telegramId")`,

  `CREATE TABLE IF NOT EXISTS "Task" (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    reward DOUBLE PRECISION NOT NULL,
    "adminCut" DOUBLE PRECISION DEFAULT 0,
    "verifyType" TEXT DEFAULT 'manual',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_task_type_active ON "Task"(type, "isActive")`,

  `CREATE TABLE IF NOT EXISTS "TaskCompletion" (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "taskId" INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    proof TEXT,
    reward DOUBLE PRECISION NOT NULL,
    "adminCut" DOUBLE PRECISION DEFAULT 0,
    "reviewedBy" BIGINT,
    "rejectReason" TEXT,
    "rejectedBy" BIGINT,
    escalated BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "taskId")
  )`,
  `CREATE INDEX IF NOT EXISTS idx_comp_status ON "TaskCompletion"(status)`,
  `CREATE INDEX IF NOT EXISTS idx_comp_user ON "TaskCompletion"("userId")`,

  `CREATE TABLE IF NOT EXISTS "Withdrawal" (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    method TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    note TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_wd_status ON "Withdrawal"(status)`,
  `CREATE INDEX IF NOT EXISTS idx_wd_user ON "Withdrawal"("userId")`,

  `CREATE TABLE IF NOT EXISTS "Promote" (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    type TEXT NOT NULL,
    link TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    commission DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'pending',
    note TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_promote_status ON "Promote"(status)`,

  `CREATE TABLE IF NOT EXISTS "Setting" (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "UserAccount" (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    platform TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    "profileUrl" TEXT,
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", platform)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_acc_user ON "UserAccount"("userId")`
]

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== SETUP_SECRET) return NextResponse.json({ ok: false }, { status: 404 })

  const logs: string[] = []
  let okCount = 0

  for (let i = 0; i < SQL.length; i++) {
    try {
      await prisma.$executeRawUnsafe(SQL[i])
      okCount++
    } catch (e: any) {
      logs.push(`❌ SQL #${i}: ${(e.message || '').substring(0, 200)}`)
    }
  }

  // Seed default settings if empty
  try {
    const defaults: Record<string, string> = {
      support_username: 'shanto13163',
      min_withdraw: '0.20',
      referral_percent: '10',
      promote_commission: '20',
      site_name: 'GoFlow Task'
    }
    for (const [k, v] of Object.entries(defaults)) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Setting" (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        k, v
      )
    }
    logs.push('✅ Settings seeded')
  } catch (e: any) {
    logs.push('Settings seed skipped: ' + (e.message || '').substring(0, 100))
  }

  return NextResponse.json({
    ok: okCount > 0,
    total: SQL.length,
    executed: okCount,
    logs
  })
}
