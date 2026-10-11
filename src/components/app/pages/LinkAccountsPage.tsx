'use client'
import { useState } from 'react'
import { ArrowLeft, Link as LinkIcon, Check } from 'lucide-react'

const ACCOUNTS = [
  { id: 'google', name: 'Google', icon: '🔵', desc: 'Link for social tasks', url: 'https://accounts.google.com' },
  { id: 'github', name: 'GitHub', icon: '⚫', desc: 'Required for repo tasks', url: 'https://github.com' },
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', desc: 'Follow & retweet tasks', url: 'https://x.com' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', desc: 'Subscribe & like tasks', url: 'https://youtube.com' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', desc: 'Follow & video tasks', url: 'https://tiktok.com' },
  { id: 'instagram', name: 'Instagram', icon: '📸', desc: 'Follow tasks', url: 'https://instagram.com' }
]

export default function LinkAccountsPage({ user, initData, onBack }: any) {
  const [linked, setLinked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('linked_accounts') || '[]') } catch { return [] }
  })
  const [pending, setPending] = useState<string | null>(null)

  const toggle = (id: string, url: string) => {
    const next = linked.includes(id) ? linked.filter(x => x !== id) : [...linked, id]
    localStorage.setItem('linked_accounts', JSON.stringify(next))
    setLinked(next)
    if (!linked.includes(id)) {
      ;(window as any).Telegram?.WebApp?.openLink(url)
      setPending(null)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <div>
        <h1 className="text-2xl font-black">Link Accounts</h1>
        <p className="text-xs text-muted mt-1">Task reward পেতে অ্যাকাউন্ট link করুন</p>
      </div>

      <div className="card-soft p-3 text-xs text-muted">
        <p>ℹ️ ক্লিক করলে respective site open হবে। ফিরে এসে <b>Confirm</b> চাপুন।</p>
      </div>

      <div className="space-y-2">
        {ACCOUNTS.map(a => {
          const isLinked = linked.includes(a.id)
          return (
            <div key={a.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg-soft flex items-center justify-center text-lg">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{a.name}</p>
                <p className="text-[10px] text-muted truncate">{a.desc}</p>
              </div>
              <button
                onClick={() => toggle(a.id, a.url)}
                className={isLinked ? 'bg-green/20 text-green px-3 py-2 rounded-xl text-[11px] font-bold' : 'bg-brand text-white px-3 py-2 rounded-xl text-[11px] font-bold'}
              >
                {isLinked ? '✓ LINKED' : 'LINK'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
