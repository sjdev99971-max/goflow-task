'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type TgUser = {
  id: string
  telegramId: string
  firstName: string | null
  lastName: string | null
  username: string | null
  photoUrl: string | null
  isAdmin: boolean
  mainBalance: number
  promoteBalance: number
  totalEarned: number
  totalReferrals: number
}

type Ctx = {
  user: TgUser | null
  loading: boolean
  error: string | null
  initData: string
  refresh: () => Promise<void>
}

const TelegramCtx = createContext<Ctx>({
  user: null,
  loading: true,
  error: null,
  initData: '',
  refresh: async () => {}
})

export function useTelegram() {
  return useContext(TelegramCtx)
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TgUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initData, setInitData] = useState('')
  const [attempted, setAttempted] = useState(false)

  const refresh = async () => {
    if (!initData) return
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
      })
      const data = await res.json()
      if (data.ok) setUser(data.user)
    } catch (e) {
      console.error(e)
    }
  }

  // Step 1: capture initData from Telegram
  useEffect(() => {
    const checkTg = () => {
      const tg = (window as any).Telegram?.WebApp
      if (!tg) return false
      try {
        tg.ready()
        tg.expand()
        tg.setHeaderColor?.('#0e0e10')
        tg.setBackgroundColor?.('#0e0e10')
      } catch {}
      const data = tg.initData || ''
      if (data) {
        setInitData(data)
        return true
      }
      return false
    }

    if (checkTg()) return
    const t1 = setTimeout(() => { if (!checkTg()) {} }, 500)
    const t2 = setTimeout(() => { if (!checkTg()) {} }, 1500)
    const t3 = setTimeout(() => {
      setError('Telegram WebApp data পাওয়া যায়নি। Bot এর Menu button থেকে খুলুন।')
      setLoading(false)
    }, 3000)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Step 2: authenticate when initData ready
  useEffect(() => {
    if (!initData || attempted) return
    setAttempted(true)

    ;(async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        })
        const data = await res.json()
        if (data.ok) {
          setUser(data.user)
          setError(null)
        } else {
          setError(`Auth fail: ${data.error || 'unknown'}${data.message ? ' — ' + data.message : ''}`)
        }
      } catch (e: any) {
        setError('Network error: ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    })()
  }, [initData, attempted])

  return (
    <TelegramCtx.Provider value={{ user, loading, error, initData, refresh }}>
      {children}
    </TelegramCtx.Provider>
  )
}

export function apiHeaders(initData: string) {
  return { 'Content-Type': 'application/json', 'x-init-data': initData }
}
