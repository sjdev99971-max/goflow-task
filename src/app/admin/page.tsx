'use client'

import { TelegramProvider, useTelegram } from '@/components/TelegramProvider'
import { useEffect, useState } from 'react'
import {
  Users, ListChecks, Wallet, Settings, LayoutDashboard, CreditCard,
  ArrowLeft, Shield, Crown, CheckCircle2, XCircle, Plus, Trash2,
  UserPlus, UserMinus, Eye, Clock, Sparkles, DollarSign
} from 'lucide-react'
import { cn, fmtMoney } from '@/lib/utils'
import { Shimmer, ListSkeleton } from '@/components/ui/Loading'

export default function AdminPage() {
  return (
    <TelegramProvider>
      <AdminInner />
    </TelegramProvider>
  )
}

function AdminInner() {
  const { user, loading, initData } = useTelegram()
  const [tab, setTab] = useState('dash')

  if (loading) return <div className="p-6 text-center text-muted">Loading...</div>
  if (!user) return <div className="p-6 text-center">Auth failed</div>
  if (!user.isAdmin) return <div className="p-6 text-center text-red-400">❌ Admin access only</div>

  const tabs = [
    { id: 'dash', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'subs', icon: ListChecks, label: 'Approvals' },
    { id: 'tasks', icon: Sparkles, label: 'Tasks' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'admins', icon: Shield, label: 'Admins' },
    { id: 'deposits', icon: CreditCard, label: 'Deposits' },
    { id: 'wd', icon: Wallet, label: 'Withdraw' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="pb-24 max-w-lg mx-auto min-h-screen">
      <div className="p-4 flex items-center gap-3 border-b border-line sticky top-0 bg-bg z-20">
        <a href="/app" className="text-muted"><ArrowLeft size={20} /></a>
        <h1 className="text-lg font-black flex-1">Admin Panel</h1>
        {(user as any).isDeveloper && (
          <span className="text-[10px] bg-gold/20 text-gold px-2 py-1 rounded-full font-bold flex items-center gap-1">
            <Crown size={10} /> DEV
          </span>
        )}
        {user.isAdmin && !(user as any).isDeveloper && (
          <span className="text-[10px] bg-brand/20 text-brand px-2 py-1 rounded-full font-bold flex items-center gap-1">
            <Shield size={10} /> ADMIN
          </span>
        )}
      </div>

      <div className="p-4">
        {tab === 'dash' && <DashTab initData={initData} />}
        {tab === 'subs' && <SubsTab initData={initData} />}
        {tab === 'tasks' && <TasksTab initData={initData} />}
        {tab === 'users' && <UsersTab initData={initData} />}
        {tab === 'admins' && <AdminsTab initData={initData} />}
        {tab === 'deposits' && <DepositsTab initData={initData} />}
        {tab === 'wd' && <WdTab initData={initData} />}
        {tab === 'settings' && <SettingsTab initData={initData} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur border-t border-line max-w-lg mx-auto z-50">
        <div className="flex overflow-x-auto scrollbar-hide py-2 px-2 gap-1">
          {tabs.map(it => {
            const Icon = it.icon
            const active = tab === it.id
            return (
              <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[60px]">
                <Icon size={18} className={active ? 'text-brand' : 'text-muted'} />
                <span className={cn('text-[9px] font-bold', active ? 'text-brand' : 'text-muted')}>{it.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============ DASH ============
function DashTab({ initData }: any) {
  const [s, setS] = useState<any>(null)
  useEffect(() => {
    fetch('/api/admin/stats', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setS(d.stats))
  }, [initData])

  if (!s) return <ListSkeleton count={3} />

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Total Users" value={s.totalUsers} />
        <StatBox label="Active Tasks" value={s.totalTasks} />
        <StatBox label="Pending Withdraw" value={s.pendingWd} color="text-gold" icon={<Clock size={12} />} />
        <StatBox label="Pending Tasks" value={s.pendingTasks} color="text-brand" icon={<Clock size={12} />} />
      </div>
      <div className="card">
        <p className="text-xs text-muted">Total Earned by Users</p>
        <p className="text-2xl font-black text-brand">${fmtMoney(s.totalEarned || 0)}</p>
      </div>
    </div>
  )
}

function StatBox({ label, value, color, icon }: any) {
  return (
    <div className="card">
      <div className="flex items-center gap-1">
        {icon}
        <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn('text-2xl font-black mt-1', color)}>{value}</p>
    </div>
  )
}

// ============ SUBMISSIONS (⭐ most important) ============
function SubsTab({ initData }: any) {
  const [subs, setSubs] = useState<any[]>([])
  const [status, setStatus] = useState('pending')
  const [busy, setBusy] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/submissions?status=${status}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(d => d.ok && setSubs(d.submissions))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status, initData])

  const act = async (id: number, action: 'approve' | 'reject') => {
    setBusy(id)
    const r = await fetch('/api/admin/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ submissionId: id, action })
    })
    const d = await r.json()
    setBusy(null)
    if (d.ok) {
      setSubs(prev => prev.filter(s => s.id !== id))
    } else {
      alert('❌ ' + (d.error || 'Failed'))
    }
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-bg-soft rounded-xl p-1 flex">
        {['pending', 'approved', 'rejected'].map(st => (
          <button
            key={st}
            onClick={() => setStatus(st)}
            className={cn('flex-1 py-2 rounded-lg text-[11px] font-bold uppercase',
              status === st ? 'bg-brand text-white' : 'text-muted')}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? <ListSkeleton count={3} /> :
       subs.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 size={40} className="mx-auto text-green/50 mb-2" />
          <p className="text-sm text-muted">No {status} submissions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-start gap-3">
                {s.user.photoUrl ? (
                  <img src={s.user.photoUrl} className="w-10 h-10 rounded-full border border-line" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-bold">
                    {s.user.firstName?.[0] || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{s.user.firstName || 'User'}</p>
                  <p className="text-[10px] text-muted">@{s.user.username || 'user'}</p>
                  <p className="text-[10px] text-muted font-mono">{s.telegramId}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-green">+${s.reward.toFixed(4)}</p>
                </div>
              </div>

              <div className="bg-bg-soft rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold">{s.task?.title}</p>
                <p className="text-[10px] text-muted capitalize">
                  {s.task?.type?.replace('_', ' ')} • {new Date(s.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="pt-2 border-t border-line">
                  <p className="text-[10px] text-muted mb-1">📎 Proof:</p>
                  <p className="text-xs font-mono break-all bg-bg rounded-lg p-2">{s.proof || '(empty)'}</p>
                </div>
              </div>

              {status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => act(s.id, 'reject')}
                    disabled={busy === s.id}
                    className="flex-1 bg-red/15 text-red py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    onClick={() => act(s.id, 'approve')}
                    disabled={busy === s.id}
                    className="flex-1 bg-green/20 text-green py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> {busy === s.id ? 'Adding...' : 'Approve + Pay'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ ADMINS ============
function AdminsTab({ initData }: any) {
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    fetch('/api/admin/admins', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setData(d))
  }
  useEffect(load, [initData])

  const act = async (action: 'promote' | 'demote', telegramId: string) => {
    setBusy(true); setMsg('')
    const r = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ action, telegramId })
    })
    const d = await r.json()
    setBusy(false)
    if (d.ok) {
      setMsg('✅ Done')
      setSearch('')
      load()
    } else {
      setMsg('❌ ' + (d.message || d.error || 'Failed'))
    }
  }

  if (!data) return <ListSkeleton count={3} />

  const me = data.currentAdminTelegramId
  const isDeveloper = data.developerId === me

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Add new admin */}
      <div className="card space-y-3">
        <p className="text-sm font-bold">➕ Promote New Admin</p>
        <p className="text-[10px] text-muted">Telegram User ID দিন</p>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="e.g. 8776974428"
            className="flex-1 bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-brand"
          />
          <button
            onClick={() => act('promote', search)}
            disabled={busy || !search}
            className="btn btn-brand text-xs px-4 disabled:opacity-50 flex items-center gap-1"
          >
            <UserPlus size={14} /> Promote
          </button>
        </div>
        {msg && <p className="text-xs">{msg}</p>}
      </div>

      {/* Current admins */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted uppercase tracking-wider px-1">
          Current Admins ({data.admins.length})
        </p>
        {data.admins.map((a: any) => {
          const isDev = a.telegramId === data.developerId
          const isMe = a.telegramId === me
          const wasPromotedByMe = a.promotedBy === me
          const canDemote = (isDeveloper || wasPromotedByMe) && !isDev && !isMe

          return (
            <div key={a.id} className="card">
              <div className="flex items-center gap-3">
                {a.photoUrl ? (
                  <img src={a.photoUrl} className="w-11 h-11 rounded-full border-2 border-gold" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full gradient-brand flex items-center justify-center font-black">
                    {a.firstName?.[0] || 'A'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{a.firstName || 'Admin'}</p>
                    {isDev && <Crown size={12} className="text-gold" />}
                    {isMe && <span className="text-[9px] bg-brand/20 text-brand px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                  </div>
                  <p className="text-[10px] text-muted truncate">@{a.username || 'user'}</p>
                  <p className="text-[10px] text-muted font-mono">{a.telegramId}</p>
                </div>
                {isDev ? (
                  <span className="text-[10px] bg-gold/20 text-gold px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    <Crown size={10} /> DEV
                  </span>
                ) : canDemote ? (
                  <button
                    onClick={() => act('demote', a.telegramId)}
                    disabled={busy}
                    className="bg-red/15 text-red px-3 py-2 rounded-lg text-[10px] font-bold active:scale-95 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <UserMinus size={12} /> Demote
                  </button>
                ) : (
                  <span className="text-[10px] text-muted px-2 py-1">🔒</span>
                )}
              </div>
              {a.promotedBy && (
                <p className="text-[9px] text-muted mt-2 pt-2 border-t border-line">
                  Promoted by: <span className="font-mono">{a.promotedBy}</span>
                  {wasPromotedByMe && <span className="text-green ml-2">← You can manage</span>}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="card-soft text-[10px] text-muted space-y-1">
        <p>🛡️ <b>Developer</b> — কেউ remove করতে পারবে না</p>
        <p>🛡️ <b>Hierarchy</b> — শুধু আপনি যে admin কে promote করেছেন তাকেই demote করতে পারবেন</p>
        <p>🛡️ <b>Self-protection</b> — নিজেকে demote করা যাবে না</p>
      </div>
    </div>
  )
}

// ============ TASKS ============
function TasksTab({ initData }: any) {
  const [tasks, setTasks] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ type: 'join_chat', title: '', link: '', reward: '', adminCut: '', verifyType: 'manual' })
  const [busy, setBusy] = useState(false)

  const load = () => fetch('/api/admin/tasks', { headers: { 'x-init-data': initData } })
    .then(r => r.json()).then(d => d.ok && setTasks(d.tasks))
  useEffect(load, [initData])

  const create = async () => {
    if (!form.title || !form.link || !form.reward) return
    setBusy(true)
    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify(form)
    })
    setBusy(false)
    setShowNew(false)
    setForm({ type: 'join_chat', title: '', link: '', reward: '', adminCut: '', verifyType: 'manual' })
    load()
  }

  const toggle = async (id: number) => {
    await fetch('/api/admin/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: JSON.stringify({ id, action: 'toggle' }) })
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Delete this task?')) return
    await fetch('/api/admin/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-init-data': initData }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <button onClick={() => setShowNew(!showNew)} className="btn btn-brand w-full flex items-center justify-center gap-2">
        <Plus size={16} /> {showNew ? 'Cancel' : 'New Task'}
      </button>

      {showNew && (
        <div className="card space-y-2">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm">
            <option value="join_chat">📢 Join Chat</option>
            <option value="bot">🤖 Message Bot</option>
            <option value="view_post">📄 View Post</option>
            <option value="micro">🧑‍💻 Micro Task</option>
            <option value="x">🚀 Follow X</option>
            <option value="tiktok">🚨 TikTok</option>
            <option value="youtube">🖇️ YouTube</option>
            <option value="instagram">🕐 Instagram</option>
          </select>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
          <input placeholder="Link (@channel or URL)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Reward USD" type="number" step="0.001" value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })} className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
            <input placeholder="Cut %" type="number" value={form.adminCut} onChange={e => setForm({ ...form, adminCut: e.target.value })} className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <select value={form.verifyType} onChange={e => setForm({ ...form, verifyType: e.target.value })} className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm">
            <option value="manual">📸 Manual (Screenshot)</option>
            <option value="auto">🤖 Auto (Telegram only)</option>
          </select>
          <button onClick={create} disabled={busy} className="btn btn-brand w-full">Create</button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className="card space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">{t.isActive ? '🟢' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{t.title}</p>
                <p className="text-[10px] text-muted capitalize">{t.type} • ${t.reward} • cut {t.adminCut}% • {t.verifyType}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-line">
              <button onClick={() => toggle(t.id)} className="btn btn-ghost flex-1 text-xs py-2">🔁 Toggle</button>
              <button onClick={() => del(t.id)} className="flex-1 bg-red/15 text-red rounded-xl text-xs py-2 font-bold flex items-center justify-center gap-1">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ USERS ============
function UsersTab({ initData }: any) {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setUsers(d.users))
      .finally(() => setLoading(false))
  }
  useEffect(load, [initData])

  const act = async (action: string, extra?: any) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ userId: selected.id, action, amount: extra })
    })
    load()
    setSelected(null)
  }

  if (selected) {
    return (
      <div className="space-y-3 animate-fade-in">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-muted text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card space-y-3">
          <div className="flex items-center gap-3">
            {selected.photoUrl ? (
              <img src={selected.photoUrl} className="w-12 h-12 rounded-full border-2 border-brand" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center font-black">
                {selected.firstName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold">{selected.firstName} {selected.lastName}</p>
              <p className="text-xs text-muted">@{selected.username || 'user'}</p>
              <p className="text-[10px] text-muted font-mono">{selected.telegramId}</p>
            </div>
            {selected.isDeveloper && <Crown size={18} className="text-gold" />}
            {selected.isAdmin && !selected.isDeveloper && <Shield size={16} className="text-brand" />}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-bg-soft rounded-xl p-2.5">
              <p className="text-muted text-[10px]">Main Balance</p>
              <p className="font-black text-brand">${fmtMoney(selected.mainBalance)}</p>
            </div>
            <div className="bg-bg-soft rounded-xl p-2.5">
              <p className="text-muted text-[10px]">Promote Balance</p>
              <p className="font-black">${fmtMoney(selected.promoteBalance)}</p>
            </div>
            <div className="bg-bg-soft rounded-xl p-2.5">
              <p className="text-muted text-[10px]">Total Earned</p>
              <p className="font-black text-green">${fmtMoney(selected.totalEarned)}</p>
            </div>
            <div className="bg-bg-soft rounded-xl p-2.5">
              <p className="text-muted text-[10px]">Referrals</p>
              <p className="font-black">{selected.totalReferrals}</p>
            </div>
          </div>
        </div>

        {/* Balance adjustment */}
        <div className="card space-y-3">
          <p className="text-sm font-bold">💰 Adjust Balance</p>
          <div className="flex gap-2">
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Amount"
              className="flex-1 bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => act('addBalance', parseFloat(amount))} className="bg-green/20 text-green py-2.5 rounded-xl text-[11px] font-bold active:scale-95">+ Main</button>
            <button onClick={() => act('subBalance', parseFloat(amount))} className="bg-red/15 text-red py-2.5 rounded-xl text-[11px] font-bold active:scale-95">− Main</button>
            <button onClick={() => act('addPromote', parseFloat(amount))} className="bg-brand/20 text-brand py-2.5 rounded-xl text-[11px] font-bold active:scale-95">+ Promote</button>
          </div>
        </div>

        {/* Admin actions */}
        <div className="card space-y-3">
          <p className="text-sm font-bold">🛡️ Admin Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => act(selected.isAdmin ? 'removeAdmin' : 'makeAdmin')}
              disabled={selected.isDeveloper}
              className="bg-brand/15 text-brand py-2.5 rounded-xl text-[11px] font-bold active:scale-95 disabled:opacity-30"
            >
              {selected.isAdmin ? '❌ Remove Admin' : '👑 Make Admin'}
            </button>
            <button
              onClick={() => act(selected.isBanned ? 'unban' : 'ban')}
              disabled={selected.isDeveloper}
              className="bg-red/15 text-red py-2.5 rounded-xl text-[11px] font-bold active:scale-95 disabled:opacity-30"
            >
              {selected.isBanned ? '✅ Unban' : '🚫 Ban'}
            </button>
          </div>
          {selected.isDeveloper && (
            <p className="text-[10px] text-gold">👑 Developer — কোনো action applicable না</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search name, @username, or ID"
          className="flex-1 bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm"
        />
        <button onClick={load} className="btn btn-brand px-4 text-xs">Search</button>
      </div>

      {loading ? <ListSkeleton count={4} /> : (
        <div className="space-y-2">
          {users.length === 0 && <div className="card text-center py-8 text-muted text-xs">No users found</div>}
          {users.map(u => (
            <button key={u.id} onClick={() => setSelected(u)} className="card w-full text-left flex items-center gap-3">
              {u.photoUrl ? (
                <img src={u.photoUrl} className="w-10 h-10 rounded-full" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-bg-soft flex items-center justify-center font-bold text-xs">
                  {u.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-sm truncate">{u.firstName || 'User'}</p>
                  {u.isDeveloper && <Crown size={11} className="text-gold" />}
                  {u.isAdmin && !u.isDeveloper && <Shield size={10} className="text-brand" />}
                  {u.isBanned && <span className="text-[9px] bg-red/20 text-red px-1.5 rounded">BAN</span>}
                </div>
                <p className="text-[10px] text-muted truncate">@{u.username || 'user'} • ${fmtMoney(u.mainBalance)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ WITHDRAWALS ============
function WdTab({ initData }: any) {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/withdrawals', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setList(d.withdrawals))
      .finally(() => setLoading(false))
  }
  useEffect(load, [initData])

  const act = async (id: number, action: string) => {
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ id, action })
    })
    load()
  }

  if (loading) return <ListSkeleton count={3} />

  return (
    <div className="space-y-2 animate-fade-in">
      {list.length === 0 && <div className="card text-center py-12 text-muted text-xs">No withdrawals</div>}
      {list.map(w => (
        <div key={w.id} className="card space-y-2">
          <div className="flex justify-between">
            <div className="min-w-0">
              <p className="font-bold text-sm">#{w.id} — {w.user?.firstName}</p>
              <p className="text-[10px] text-muted">@{w.user?.username || 'user'}</p>
              <p className="text-[10px] text-muted">{w.method} • {w.address}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-brand">${fmtMoney(w.amount)}</p>
              <p className={cn('text-[10px] font-bold',
                w.status === 'pending' ? 'text-gold' : w.status === 'approved' ? 'text-green' : 'text-red')}>
                {w.status}
              </p>
            </div>
          </div>
          {w.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => act(w.id, 'approve')} className="flex-1 bg-green/20 text-green py-2.5 rounded-xl text-xs font-bold active:scale-95">✅ Approve</button>
              <button onClick={() => act(w.id, 'reject')} className="flex-1 bg-red/15 text-red py-2.5 rounded-xl text-xs font-bold active:scale-95">❌ Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


// ============ DEPOSITS ============
function DepositsTab({ initData }: any) {
  const [subs, setSubs] = useState<any[]>([])
  const [status, setStatus] = useState('pending')
  const [busy, setBusy] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [creditTo, setCreditTo] = useState<'main' | 'promote' | 'both'>('main')

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/deposits?status=${status}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(d => d.ok && setSubs(d.deposits))
      .finally(() => setLoading(false))
  }
  useEffect(load, [status, initData])

  const approve = async (id: number) => {
    setBusy(id)
    const r = await fetch('/api/admin/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ depositId: id, action: 'approve', creditTo })
    })
    const d = await r.json()
    setBusy(null)
    if (d.ok) setSubs(prev => prev.filter(s => s.id !== id))
    else alert('❌ ' + (d.error || 'Failed'))
  }

  const reject = async () => {
    if (!rejectId || !rejectReason.trim()) return
    setBusy(rejectId)
    const r = await fetch('/api/admin/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ depositId: rejectId, action: 'reject', reason: rejectReason.trim() })
    })
    const d = await r.json()
    setBusy(null)
    if (d.ok) {
      setSubs(prev => prev.filter(s => s.id !== rejectId))
      setRejectId(null); setRejectReason('')
    }
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-bg-soft rounded-xl p-1 flex">
        {['pending', 'approved', 'rejected'].map(st => (
          <button key={st} onClick={() => setStatus(st)}
            className={cn('flex-1 py-2 rounded-lg text-[11px] font-bold uppercase',
              status === st ? 'bg-brand text-white' : 'text-muted')}>
            {st}
          </button>
        ))}
      </div>

      <div className="card-soft">
        <p className="text-[10px] text-muted mb-2">Credit approved amount to:</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'main', label: 'Main' },
            { id: 'promote', label: 'Promote' },
            { id: 'both', label: 'Both' }
          ].map(t => (
            <button key={t.id} onClick={() => setCreditTo(t.id as any)}
              className={cn('py-2 rounded-lg text-[11px] font-bold',
                creditTo === t.id ? 'bg-brand text-white' : 'bg-bg-soft text-muted')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <ListSkeleton count={3} /> :
       subs.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 size={40} className="mx-auto text-green/50 mb-2" />
          <p className="text-sm text-muted">No {status} deposits</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-start gap-3">
                {s.user.photoUrl ? (
                  <img src={s.user.photoUrl} className="w-10 h-10 rounded-full border border-line" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-bold">
                    {s.user.firstName?.[0] || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{s.user.firstName}</p>
                  <p className="text-[10px] text-muted">@{s.user.username || 'user'}</p>
                  <p className="text-[10px] text-muted font-mono">{s.user.telegramId}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-green">${fmtMoney(s.amount)}</p>
                  <p className="text-[9px] text-muted uppercase font-bold">{s.method}</p>
                </div>
              </div>

              <div className="bg-bg-soft rounded-xl p-3 space-y-1 text-[10px]">
                <p className="text-muted">TXID:</p>
                <p className="font-mono break-all text-xs">{s.txid || '—'}</p>
                {s.senderAddr && <p className="text-muted mt-1">Sender: <span className="font-mono">{s.senderAddr}</span></p>}
                {s.rejectReason && <p className="text-red mt-1">❌ Reason: {s.rejectReason}</p>}
              </div>

              {status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => setRejectId(s.id)} disabled={busy === s.id}
                    className="flex-1 bg-red/15 text-red py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50">
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => approve(s.id)} disabled={busy === s.id}
                    className="flex-1 bg-green/20 text-green py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50">
                    <CheckCircle2 size={14} /> {busy === s.id ? 'Adding...' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-bg-card rounded-t-3xl p-5 space-y-3 animate-fade-in">
            <p className="text-sm font-bold">❌ Reject Deposit #{rejectId}</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason (must)" rows={3}
              className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectId(null); setRejectReason('') }}
                className="flex-1 btn btn-ghost">Cancel</button>
              <button onClick={reject} disabled={!rejectReason.trim()}
                className="flex-1 bg-red text-white rounded-xl py-3 font-bold disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ SETTINGS ============
function SettingsTab({ initData }: any) {
  const [s, setS] = useState<any>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setS(d.settings))
      .finally(() => setLoading(false))
  }, [initData])

  const save = async () => {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify(s)
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <ListSkeleton count={4} />

  const fields = [
    ['site_name', 'Site Name', 'text'],
    ['support_username', 'Support Username (no @)', 'text'],
    ['developer_id', '👑 Developer Telegram ID', 'text'],
    ['min_withdraw', 'Min Withdraw (USD)', 'number'],
    ['min_deposit', 'Min Deposit (USD)', 'number'],
    ['min_promote', 'Min Promote (USD)', 'number'],
    ['deposit_binance_uid', 'Deposit — Binance UID', 'text'],
    ['deposit_bep20_address', 'Deposit — BEP20 Address', 'text'],
    ['deposit_ton_address', 'Deposit — TON Address', 'text'],
    ['referral_percent', 'Referral %', 'number'],
    ['promote_commission', 'Promote Commission %', 'number'],
    ['force_channels', 'Force Channels (comma)', 'text'],
    ['welcome_text', 'Welcome Text', 'textarea']
  ]

  return (
    <div className="space-y-3 animate-fade-in">
      {fields.map(([k, label, type]) => (
        <div key={k}>
          <label className="text-[10px] text-muted uppercase tracking-wider font-bold">{label}</label>
          {type === 'textarea' ? (
            <textarea
              value={s[k] || ''}
              onChange={e => setS({ ...s, [k]: e.target.value })}
              rows={3}
              className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-1 text-sm"
            />
          ) : (
            <input
              value={s[k] || ''}
              onChange={e => setS({ ...s, [k]: e.target.value })}
              type={type}
              className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-1 text-sm font-mono"
            />
          )}
        </div>
      ))}
      <button onClick={save} className="btn btn-brand w-full">
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
      <div className="card-soft text-[10px] text-muted">
        💡 <b>Developer ID</b> — এই ID কেউ remove করতে পারবে না। প্রথম user auto developer হয়ে যাবে।
      </div>
    </div>
  )
}
