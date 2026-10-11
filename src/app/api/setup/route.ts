import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SETUP_SECRET = 'shanto-setup-2026'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== SETUP_SECRET) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const logs: string[] = []
  const url = process.env.DATABASE_URL || ''

  logs.push(`DB URL prefix: ${url.substring(0, 40)}`)

  try {
    // Step 1: generate
    logs.push('Running prisma generate...')
    const gen = await execAsync('npx prisma generate', { timeout: 30000 })
    logs.push('generate stdout: ' + (gen.stdout || '').substring(0, 500))

    // Step 2: db push
    logs.push('Running prisma db push...')
    const push = await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
      timeout: 50000,
      env: { ...process.env }
    })
    logs.push('push stdout: ' + (push.stdout || '').substring(0, 800))
    logs.push('push stderr: ' + (push.stderr || '').substring(0, 800))

    return NextResponse.json({ ok: true, logs })
  } catch (e: any) {
    logs.push('ERROR: ' + (e.message || String(e)))
    if (e.stdout) logs.push('stdout: ' + e.stdout.substring(0, 500))
    if (e.stderr) logs.push('stderr: ' + e.stderr.substring(0, 500))
    return NextResponse.json({ ok: false, logs, error: e.message })
  }
}
