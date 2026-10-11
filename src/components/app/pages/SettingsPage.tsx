'use client'
import { useState } from 'react'
import { ArrowLeft, Globe, Bell, Shield, Users, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage({ user, initData, onBack, setPage }: any) {
  const [notify, setNotify] = useState(true)
  const [lang, setLang] = useState('en')

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-black">Settings</h1>

      <div className="card space-y-1">
        <p className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-1">Account</p>

        <button
          onClick={() => setPage && setPage('accounts')}
          className="w-full flex items-center gap-3 py-3 active:opacity-70"
        >
          <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center">
            <Users size={16} className="text-brand" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Account Management</p>
            <p className="text-[10px] text-muted">Link social accounts for tasks</p>
          </div>
          <ChevronRight size={16} className="text-muted" />
        </button>

        <div className="h-px bg-line" />

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-bg-soft flex items-center justify-center text-brand">
            <Shield size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Account Type</p>
            <p className="text-[10px] text-muted">{user.isAdmin ? 'Administrator' : 'Standard User'}</p>
          </div>
          {user.isAdmin && <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
        </div>

        <div className="h-px bg-line" />

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-bg-soft flex items-center justify-center text-brand">
            <Bell size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[10px] text-muted">Task updates, withdrawals</p>
          </div>
          <button onClick={() => setNotify(!notify)} className={cn('w-11 h-6 rounded-full transition relative', notify ? 'bg-brand' : 'bg-line')}>
            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow', notify ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </div>

        <div className="h-px bg-line" />

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-bg-soft flex items-center justify-center text-brand">
            <Globe size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Language</p>
            <p className="text-[10px] text-muted">App display language</p>
          </div>
          <select value={lang} onChange={e => setLang(e.target.value)} className="bg-bg-soft border border-line rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand">
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
          </select>
        </div>
      </div>

      <div className="card space-y-1">
        <p className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-1">Info</p>
        <div className="flex justify-between py-2.5 text-sm">
          <span className="text-muted">User ID</span>
          <span className="font-mono text-xs">{user.telegramId}</span>
        </div>
        <div className="h-px bg-line" />
        <div className="flex justify-between py-2.5 text-sm">
          <span className="text-muted">Username</span>
          <span className="text-xs">@{user.username || 'N/A'}</span>
        </div>
        <div className="h-px bg-line" />
        <div className="flex justify-between py-2.5 text-sm">
          <span className="text-muted">Version</span>
          <span className="text-xs">v1.0.0</span>
        </div>
      </div>

      <a
        href="https://t.me/shanto13163"
        target="_blank"
        rel="noreferrer"
        className="card flex items-center gap-3 active:opacity-70"
      >
        <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center text-brand text-sm">🖇️</div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Contact Support</p>
          <p className="text-[10px] text-muted">24/7 available</p>
        </div>
        <ChevronRight size={16} className="text-muted" />
      </a>
    </div>
  )
}
