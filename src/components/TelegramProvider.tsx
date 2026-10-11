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
  initData: string
  refresh: () => Promise<void>
}

const TelegramCtx = createContext<Ctx>({
  user: null,
  loading: true,
  initData: '',
  refresh: async () => {}
})

export function useTelegram() {
  return useContext(TelegramCtx)
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TgUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initData, setInitData] = useState('')

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'x-init-data': initData }
      })
      const data = await res.json()
      if (data.ok) setUser(data.user)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor?.('#0e0e10')
      tg.setBackgroundColor?.('#0e0e10')
      const data = tg.initData || ''
      setInitData(data)
    }
  }, [])

  useEffect(() => {
    if (!initData) return
    ;(async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'x-init-data': initData }
        })
        const data = await res.json()
        if (data.ok) setUser(data.user)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [initData])

  return (
    <TelegramCtx.Provider value={{ user, loading, initData, refresh }}>
      {children}
    </TelegramCtx.Provider>
  )
}

export function apiHeaders(initData: string) {
  return { 'Content-Type': 'application/json', 'x-init-data': initData }
}
