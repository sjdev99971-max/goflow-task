import { prisma } from './prisma'

const DEFAULTS: Record<string, string> = {
  support_username: 'GoFlowSupport',
  min_withdraw: '0.20',
  referral_percent: '10',
  promote_commission: '20',
  force_channels: '',
  bot_username: '',
  welcome_text: '👋 Welcome to GoFlow Task!\n\nComplete tasks and earn money.',
  site_name: 'GoFlow Task'
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? DEFAULTS[key] ?? ''
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const map: Record<string, string> = { ...DEFAULTS }
  for (const r of rows) map[r.key] = r.value
  return map
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  })
}
