'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, X, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/Loading'

const PLATFORMS = [
  { id: 'google', name: 'Google', icon: '🔴', placeholder: 'your@gmail.com', url: 'https://accounts.google.com', field: 'email' },
  { id: 'github', name: 'GitHub', icon: '⚫', placeholder: 'github_username', url: 'https://github.com', field: 'username' },
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', placeholder: 'twitter_handle', url: 'https://x.com', field: 'username' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', placeholder: 'channel_name', url: 'https://youtube.com', field: 'username' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', placeholder: 'tiktok_handle', url: 'https://tiktok.com', field: 'username' },
  { id: 'instagram', name: 'Instagram', icon: '📸', placeholder: 'instagram_handle', url: 'https://instagram.com', field: 'username' }
]

export default function LinkAccountsPage({ user, initData, onBack }: any) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/user/accounts', { headers: { 'x-init-data': initData } })
    const d = await r.json()
    if (d.ok) setAccounts(d.accounts || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [initData])

  const save = async (platform: string) => {
    if (!input.trim()) return
    setBusy(true); setMsg('')
    const pl = PLATFORMS.find(p => p.id === platform)!
    const body: any = { platform, username: input.trim() }
    if (pl.field === 'email') {
      body.email = input.trim()
      body.username = input.trim()
    }
    const r = await fetch('/api/user/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify(body)
    })
    const d = await r.json()
    setBusy(false)
    if (d.ok) {
      setMsg('✅ Saved!')
      setInput('')
      setEditing(null)
      load()
    } else {
      setMsg('❌ ' + (d.error || 'Failed'))
    }
  }

  const remove = async (platform: string) => {
    if (!confirm(`Unlink ${platform}?`)) return
    await fetch('/api/user/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ platform })
    })
    load()
  }

  const linkedCount = accounts.length

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-black">Account Management</h1>
        <p className="text-xs text-muted mt-1">
          একবার account save করলে task এ auto-fill হবে। বার বার type করতে হবে না।
        </p>
      </div>

      <div className="card-soft flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Linked</span>
        <span className="text-sm font-black text-brand">{linkedCount}/{PLATFORMS.length}</span>
      </div>

      {msg && <p className="text-center text-xs text-brand">{msg}</p>}

      <div className="space-y-2">
        {PLATFORMS.map(p => {
          const acc = accounts.find(a => a.platform === p.id)
          const isEditing = editing === p.id
          return (
            <div key={p.id} className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg-soft flex items-center justify-center text-lg flex-shrink-0">
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{p.name}</p>
                  {acc ? (
                    <p className="text-[10px] text-green truncate">✓ {acc.username}</p>
                  ) : (
                    <p className="text-[10px] text-muted">Not linked</p>
                  )}
                </div>
                {acc && !isEditing && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setEditing(p.id); setInput(acc.username) }}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-bg-soft text-muted"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="w-7 h-7 rounded-lg bg-red/10 flex items-center justify-center"
                    >
                      <X size={12} className="text-red" />
                    </button>
                  </div>
                )}
                {!acc && !isEditing && (
                  <button
                    onClick={() => { setEditing(p.id); setInput('') }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-brand text-white flex items-center gap-1"
                  >
                    <Plus size={10} /> LINK
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="mt-3 pt-3 border-t border-line space-y-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={p.placeholder}
                    autoFocus
                    className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(null); setInput('') }}
                      className="btn btn-ghost flex-1 text-xs py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => save(p.id)}
                      disabled={busy || !input.trim()}
                      className="btn btn-brand flex-1 text-xs py-2 disabled:opacity-50"
                    >
                      {busy ? <span className='inline-flex items-center gap-2'><Spinner size={12} /> Saving...</span> : 'Save'}
                    </button>
                  </div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-muted flex items-center justify-center gap-1 pt-1"
                  >
                    <ExternalLink size={10} /> Open {p.name} to verify
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card-soft text-xs text-muted">
        🔒 আপনার তথ্য শুধু task verify করার জন্য ব্যবহৃত হবে।
      </div>
    </div>
  )
}
