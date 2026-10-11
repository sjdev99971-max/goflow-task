'use client'
import { useEffect, useState } from 'react'
import { Search, ChevronDown, ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { cn, fmtMoney } from '@/lib/utils'
import { TaskSkeleton, Shimmer } from '@/components/ui/Loading'

const CATEGORIES = [
  { key: 'all', label: 'ALL', icon: '🌐' },
  { key: 'join_chat', label: 'Telegram', icon: '✈️' },
  { key: 'x', label: 'Twitter', icon: '𝕏' },
  { key: 'view_post', label: 'Facebook', icon: '📘' },
  { key: 'micro', label: 'GitHub', icon: '⚫' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'bot', label: 'Bot', icon: '🤖' }
]

export default function TasksTab({ initData, setPage }: any) {
  const [activeCat, setActiveCat] = useState('all')
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    const url = activeCat === 'all'
      ? '/api/user/tasks'
      : `/api/user/tasks?type=${activeCat}`
    fetch(url, { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(d => setTasks(d.tasks || []))
      .finally(() => setLoading(false))
  }, [activeCat, initData])

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  )

  if (selectedTask) {
    return <TaskDetail task={selectedTask} initData={initData} onBack={() => setSelectedTask(null)} />
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black">Task Center</h1>
        <button onClick={() => setPage("history")} className="chip chip-idle flex items-center gap-1">
          <Clock size={12} /> History
        </button>
      </div>

      {/* Segment Tabs */}
      <div className="bg-bg-soft rounded-xl p-1 flex">
        <button className="flex-1 py-2 rounded-lg bg-brand text-white text-xs font-bold">QUICK TASKS</button>
        <button className="flex-1 py-2 text-xs font-semibold text-muted">HIGH VALUE 6</button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full bg-bg-card border border-line rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-brand"
        />
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCat(c.key)}
            className={cn('chip flex items-center gap-1.5', activeCat === c.key ? 'chip-active' : 'chip-idle')}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Link Accounts */}
      <button onClick={() => setPage("accounts")} className="card-soft w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-brand">🔗</span>
          <span className="text-sm font-semibold">LINK ACCOUNTS <span className="text-brand">{CATEGORIES.length - 1}</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gold font-bold">+8</span>
          <span className="text-xs text-green font-bold">+0.08</span>
          <ChevronDown size={14} className="text-muted" />
        </div>
      </button>

      {/* Available count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[11px] font-bold text-txt-soft uppercase tracking-wider">Available</span>
        </div>
        <span className="text-[11px] text-muted">{filtered.length}</span>
      </div>

      {/* Tasks */}
      {loading ? (
        <div className="space-y-2">
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10 text-muted text-sm">No tasks available</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />)}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onClick }: any) {
  const done = task.completed === 'approved'
  const pending = task.completed === 'pending'
  const reward = task.reward

  const iconFor = () => {
    const map: any = {
      join_chat: '✈️', bot: '🤖', view_post: '📘', micro: '⚫',
      x: '𝕏', tiktok: '🎵', youtube: '▶️', instagram: '📸'
    }
    return map[task.type] || '🎯'
  }

  return (
    <div className="card flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-bg-soft border border-line flex items-center justify-center text-lg flex-shrink-0">
        {iconFor()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-green">+${reward.toFixed(3)}</span>
          <div className="flex-1 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: '30%' }} />
          </div>
          <span className="text-[10px] text-muted">#{task.id}</span>
        </div>
      </div>
      <button
        onClick={onClick}
        className={cn('px-3 py-2 rounded-xl text-[11px] font-bold flex-shrink-0',
          done ? 'bg-green/20 text-green' : pending ? 'bg-gold/20 text-gold' : 'bg-brand text-white shadow-brand'
        )}
      >
        {done ? '✓ DONE' : pending ? 'PENDING' : 'START'}
      </button>
    </div>
  )
}

function TaskDetail({ task, initData, onBack }: any) {
  const [proof, setProof] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [accounts, setAccounts] = useState<any[]>([])
  const reward = +(task.reward * (1 - (task.adminCut || 0) / 100)).toFixed(4)

  useEffect(() => {
    fetch('/api/user/accounts', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setAccounts(d.accounts || []))
  }, [initData])

  // Suggest account based on task type
  const suggestPlatform = () => {
    const map: any = {
      join_chat: null, bot: null,
      view_post: 'google',
      micro: 'github',
      x: 'twitter',
      tiktok: 'tiktok',
      youtube: 'youtube',
      instagram: 'instagram'
    }
    return map[task.type]
  }

  const suggested = accounts.find(a => a.platform === suggestPlatform())

  const submit = async () => {
    if (!proof) return
    setBusy(true); setMsg('')
    const res = await fetch('/api/user/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ taskId: task.id, proof })
    })
    const d = await res.json()
    setBusy(false)
    if (d.ok) setMsg('✅ Submitted! Admin approve করলে credit পাবেন।')
    else setMsg('❌ ' + (d.error || 'Failed'))
  }

  return (
    <div className="p-4 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <p className="text-lg font-bold">{task.title}</p>
        {task.description && <p className="text-xs text-muted mt-1">{task.description}</p>}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-bg-soft rounded-xl p-3">
            <p className="text-[10px] text-muted uppercase tracking-wider">Reward</p>
            <p className="text-lg font-black text-green">${reward}</p>
          </div>
          <div className="bg-bg-soft rounded-xl p-3">
            <p className="text-[10px] text-muted uppercase tracking-wider">Type</p>
            <p className="text-sm font-bold capitalize mt-1">{task.type.replace('_', ' ')}</p>
          </div>
        </div>

        <a href={task.link} target="_blank" rel="noreferrer" className="btn btn-brand w-full mt-4 block text-center">
          🔗 Open Task Link
        </a>

        <div className="mt-4 pt-4 border-t border-line">
          {task.verifyType === 'auto' ? (
            <p className="text-xs text-muted text-center">Auto verification — link খুললেই হবে</p>
          ) : (
            <>
              <label className="text-xs text-muted font-bold">📸 Proof (username / screenshot URL)</label>

              {suggested && (
                <div className="mt-2 bg-brand/10 border border-brand/30 rounded-xl p-3">
                  <p className="text-[10px] text-brand font-bold mb-1">✨ Suggested from saved accounts</p>
                  <button
                    onClick={() => setProof(suggested.username)}
                    className="w-full flex items-center justify-between bg-bg-card border border-line rounded-lg px-3 py-2 active:scale-95 transition"
                  >
                    <span className="text-xs font-mono truncate">{suggested.username}</span>
                    <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded-full font-bold">USE</span>
                  </button>
                </div>
              )}

              {!suggested && suggestPlatform() && (
                <div className="mt-2 bg-bg-soft border border-line rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted mb-1">
                    এই task এর জন্য {suggestPlatform()} account save করুন
                  </p>
                  <button
                    onClick={() => {
                      onBack()
                      // Navigate to accounts — parent should handle
                    }}
                    className="text-[10px] text-brand font-bold"
                  >
                    → Go to Account Management
                  </button>
                </div>
              )}

              <input
                value={proof}
                onChange={e => setProof(e.target.value)}
                placeholder="Paste username or screenshot URL"
                className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-2 text-sm focus:outline-none focus:border-brand"
              />
              <button onClick={submit} disabled={busy || !proof} className="btn btn-brand w-full mt-3">
                {busy ? 'Submitting...' : 'Submit Proof'}
              </button>
            </>
          )}
          {msg && <p className="text-xs text-center mt-2">{msg}</p>}
        </div>
      </div>
    </div>
  )
}