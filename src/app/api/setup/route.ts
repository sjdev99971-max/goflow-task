import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SETUP_SECRET = 'shanto-setup-2026'

const SQL: string[] = [
  // ═══ User table (create if not exists) ═══
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

  // ═══ ALTER: add missing columns to existing table ═══
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isDeveloper" BOOLEAN DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "promotedBy" BIGINT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "promotedAt" TIMESTAMP`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "languageCode" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalWithdrawn" DOUBLE PRECISION DEFAULT 0`,

  // ═══ Indexes ═══
  `CREATE INDEX IF NOT EXISTS idx_user_referrer ON "User"("referrerId")`,
  `CREATE INDEX IF NOT EXISTS idx_user_earned ON "User"("totalEarned")`,
  `CREATE INDEX IF NOT EXISTS idx_user_refs ON "User"("totalReferrals")`,
  `CREATE INDEX IF NOT EXISTS idx_user_tg ON "User"("telegramId")`,

  // ═══ Task ═══
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

  // ═══ TaskCompletion ═══
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

  // ALTER: add missing columns
  `ALTER TABLE "TaskCompletion" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT`,
  `ALTER TABLE "TaskCompletion" ADD COLUMN IF NOT EXISTS "rejectedBy" BIGINT`,
  `ALTER TABLE "TaskCompletion" ADD COLUMN IF NOT EXISTS "escalated" BOOLEAN DEFAULT false`,
  `ALTER TABLE "TaskCompletion" ADD COLUMN IF NOT EXISTS "reviewedBy" BIGINT`,
  `ALTER TABLE "TaskCompletion" ADD COLUMN IF NOT EXISTS "adminCut" DOUBLE PRECISION DEFAULT 0`,

  `CREATE INDEX IF NOT EXISTS idx_comp_status ON "TaskCompletion"(status)`,
  `CREATE INDEX IF NOT EXISTS idx_comp_user ON "TaskCompletion"("userId")`,

  // ═══ Withdrawal ═══
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

  // ═══ Promote ═══
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

  // ═══ Setting ═══
  `CREATE TABLE IF NOT EXISTS "Setting" (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  // ═══ UserAccount ═══
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
  `CREATE INDEX IF NOT EXISTS idx_acc_user ON "UserAccount"("userId")`,

  `CREATE TABLE IF NOT EXISTS "Deposit" (
    id SERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    method TEXT NOT NULL,
    txid TEXT,
    "senderAddr" TEXT,
    status TEXT DEFAULT 'pending',
    note TEXT,
    "rejectReason" TEXT,
    "reviewedBy" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_dep_user ON "Deposit"("userId")`,
  `CREATE INDEX IF NOT EXISTS idx_dep_status ON "Deposit"(status)`,

  // Settings
  `INSERT INTO "Setting" (key, value) VALUES ('deposit_binance_uid', '') ON CONFLICT (key) DO NOTHING`,
  `INSERT INTO "Setting" (key, value) VALUES ('deposit_bep20_address', '') ON CONFLICT (key) DO NOTHING`,
  `INSERT INTO "Setting" (key, value) VALUES ('deposit_ton_address', '') ON CONFLICT (key) DO NOTHING`,
  `INSERT INTO "Setting" (key, value) VALUES ('min_deposit', '1') ON CONFLICT (key) DO NOTHING`,
  `INSERT INTO "Setting" (key, value) VALUES ('min_promote', '1') ON CONFLICT (key) DO NOTHING`,
]

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== SETUP_SECRET) return NextResponse.json({ ok: false }, { status: 404 })

  const results: any[] = []
  let okCount = 0
  let failCount = 0

  for (let i = 0; i < SQL.length; i++) {
    const q = SQL[i].trim().split('\n')[0].substring(0, 70)
    try {
      await prisma.$executeRawUnsafe(SQL[i])
      okCount++
      results.push({ i, ok: true, q })
    } catch (e: any) {
      failCount++
      results.push({ i, ok: false, q, err: (e.message || '').substring(0, 150) })
    }
  }

  // Seed default settings
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
  } catch {}

  return NextResponse.json({
    ok: failCount === 0,
    total: SQL.length,
    executed: okCount,
    failed: failCount,
    results: results.filter(r => !r.ok) // only show failures
  })
}
