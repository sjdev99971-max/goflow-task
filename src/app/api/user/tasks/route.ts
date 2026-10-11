import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  const tasks = await prisma.task.findMany({
    where: { isActive: true, ...(type ? { type } : {}) },
    orderBy: { id: 'desc' }
  })

  const completed = await prisma.taskCompletion.findMany({
    where: { userId: user.id },
    select: { taskId: true, status: true }
  })
  const completedMap = Object.fromEntries(completed.map(c => [c.taskId, c.status]))

  return NextResponse.json({
    ok: true,
    tasks: tasks.map(t => ({
      ...t,
      completed: completedMap[t.id] || null
    }))
  })
}
