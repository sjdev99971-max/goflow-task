import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const tasks = await prisma.task.findMany({ orderBy: { id: 'desc' }, take: 200 })
  return NextResponse.json({ ok: true, tasks })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })

  const body = await req.json()
  const { type, title, description, link, reward, adminCut, verifyType } = body

  if (!type || !title || !link || !reward) return NextResponse.json({ ok: false, error: 'missing' })

  const task = await prisma.task.create({
    data: {
      type,
      title,
      description: description || null,
      link,
      reward: parseFloat(reward),
      adminCut: parseFloat(adminCut || 0),
      verifyType: verifyType || 'manual'
    }
  })
  return NextResponse.json({ ok: true, task })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const { id, action } = await req.json()
  if (action === 'toggle') {
    const t = await prisma.task.findUnique({ where: { id } })
    await prisma.task.update({ where: { id }, data: { isActive: !t!.isActive } })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await req.json()
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
