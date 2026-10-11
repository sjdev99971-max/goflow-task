'use client'

import { TelegramProvider, useTelegram, apiHeaders } from '@/components/TelegramProvider'
import { useEffect, useState } from 'react'
import { Users, ListChecks, Wallet, Settings, LayoutDashboard, ArrowLeft } from 'lucide-react'
import { cn, fmtMoney } from '@/lib/utils'

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

  if (loading) return <div className="p-6 text-center text-tg-muted">Loading...</div>
  if (!user) return <div className="p-6 text-center">Auth failed</div>
  if (!user.isAdmin) return <div className="p-6 text-center text-red-400">❌ Admin access only</div>

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="p-4 flex items-center gap-3 border-b border-tg-border sticky top-0 bg-tg-bg z-10">
        <a href="/app" className="text-tg-muted"><ArrowLeft size={20} /></a>
        <h1 className="text-xl font-bold">🛠️ Admin Panel</h1>
      </div>

      {tab === 'dash' && <DashTab initData={initData} />}
      {tab === 'users' && <UsersTab initData={initData} />}
      {tab === 'tasks' && <TasksTab initData={initData} />}
      {tab === 'withdrawals' && <WdTab initData={initData} />}
      {tab === 'settings' && <SettingsTab initData={initData} />}

      <div className="fixed bottom-0 left-0 right-0 bg-tg-card/95 backdrop-blur border-t border-tg-border max-w-lg mx-auto">
        <div className="flex justify-around py-2">
          {[
            { id: 'dash', icon: LayoutDashboard, label: 'Dash' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'tasks', icon: ListChecks, label: 'Tasks' },
            { id: 'withdrawals', icon: Wallet, label: 'Wd' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(it => {
            const I = it.icon
            const active = tab === it.id
            return (
              <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-0.5 px-3 py-1">
                <I size={20} className={active ? 'text-tg-primary' : 'text-tg-muted'} />
                <span className={cn('text-[10px]', active ? 'text-tg-primary' : 'text-tg-muted')}>{it.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DashTab({ initData }: any) {
  const [s, setS] = useState<any>(null)
  useEffect(() => {
    fetch('/api/admin/stats', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(d => d.ok && setS(d.stats))
  }, [initData])

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Box label="Total Users" value={s?.totalUsers ?? '...'} />
        <Box label="Active Tasks" value={s?.totalTasks ?? '...'} />
        <Box label="Pending Wd" value={s?.pendingWd ?? '...'} color="text-yellow-400" />
        <Box label="Pending Tasks" value={s?.pendingTasks ?? '...'} color="text-yellow-400" />
      </div>
      <div className="card">
        <p className="text-xs text-tg-muted">Total Earned by Users</p>
        <p className="text-2xl font-bold text-tg-primary">${fmtMoney(s?.totalEarned || 0)}</p>
      </div>
    </div>
  )
}

function Box({ label, value, color }: any) {
  return (
    <div className="card">
      <p className="text-xs text-tg-muted">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
    </div>
  )
}

function UsersTab({ initData }: any) {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  const load = () => {
    fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(d => d.ok && setUsers(d.users))
  }
  useEffect(() => { load() }, [initData])

  const act = async (action: string, amount?: number) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ userId: selected.id, action, amount })
    })
    load()
    setSelected(null)
  }

  if (selected) {
    return (
      <div className="p-4 space-y-3">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-tg-muted text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card">
          <p className="font-bold text-lg">{selected.firstName} {selected.lastName}</p>
          <p className="text-sm text-tg-muted">@{selected.username || 'user'}</p>
          <p className="text-xs text-tg-muted">TG: {selected.telegramId}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-tg-muted text-xs">Main</p><p className="font-bold">${fmtMoney(selected.mainBalance)}</p></div>
            <div><p className="text-tg-muted text-xs">Promote</p><p className="font-bold">${fmtMoney(selected.promoteBalance)}</p></div>
            <div><p className="text-tg-muted text-xs">Earned</p><p className="font-bold">${fmtMoney(selected.totalEarned)}</p></div>
            <div><p className="text-tg-muted text-xs">Referrals</p><p className="font-bold">{selected.totalReferrals}</p></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => act(selected.isAdmin ? 'removeAdmin' : 'makeAdmin')} className="btn btn-ghost text-sm">
            {selected.isAdmin ? '❌ Remove Admin' : '👑 Make Admin'}
          </button>
          <button onClick={() => act(selected.isBanned ? 'unban' : 'ban')} className="btn btn-ghost text-sm">
            {selected.isBanned ? '✅ Unban' : '🚫 Ban'}
          </button>
          <AddBalanceBtn label="+ $1 Main" onClick={() => act('addBalance', 1)} />
          <AddBalanceBtn label="- $1 Main" onClick={() => act('subBalance', 1)} />
          <AddBalanceBtn label="+ $1 Promote" onClick={() => act('addPromote', 1)} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user..." className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2" />
      <button onClick={load} className="btn btn-primary w-full text-sm">Search</button>
      <div className="space-y-2">
        {users.map(u => (
          <button key={u.id} onClick={() => setSelected(u)} className="card w-full text-left">
            <p className="font-medium text-sm">{u.firstName} {u.isAdmin && '👑'} {u.isBanned && '🚫'}</p>
            <p className="text-xs text-tg-muted">@{u.username || 'user'} • ${fmtMoney(u.mainBalance)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function AddBalanceBtn({ label, onClick }: any) {
  return <button onClick={onClick} className="btn btn-ghost text-xs">{label}</button>
}

function TasksTab({ initData }: any) {
  const [tasks, setTasks] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ type: 'join_chat', title: '', link: '', reward: '', adminCut: '', verifyType: 'manual' })

  const load = () => fetch('/api/admin/tasks', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(d => d.ok && setTasks(d.tasks))
  useEffect(() => { load() }, [initData])

  const create = async () => {
    await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify(form)
    })
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
    <div className="p-4 space-y-3">
      <button onClick={() => setShowNew(!showNew)} className="btn btn-primary w-full">➕ New Task</button>

      {showNew && (
        <div className="card space-y-2">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2">
            <option value="join_chat">📢 Join Chat</option>
            <option value="bot">🤖 Message Bot</option>
            <option value="view_post">📄 View Post</option>
            <option value="micro">🧑‍💻 Micro Task</option>
            <option value="x">🚀 Follow X</option>
            <option value="tiktok">🚨 TikTok</option>
            <option value="youtube">🖇️ YouTube</option>
            <option value="instagram">🕐 Instagram</option>
          </select>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2" />
          <input placeholder="Link (@channel or URL)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2" />
          <input placeholder="Reward USD (e.g. 0.05)" type="number" step="0.001" value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })} className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2" />
          <input placeholder="Admin Cut % (0-100)" type="number" step="1" value={form.adminCut} onChange={e => setForm({ ...form, adminCut: e.target.value })} className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2" />
          <select value={form.verifyType} onChange={e => setForm({ ...form, verifyType: e.target.value })} className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2">
            <option value="manual">📸 Manual (Screenshot)</option>
            <option value="auto">🤖 Auto (Telegram only)</option>
          </select>
          <button onClick={create} className="btn btn-primary w-full">Create</button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className="card space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-sm">{t.isActive ? '🟢' : '🔴'} {t.title}</p>
                <p className="text-xs text-tg-muted">{t.type} • ${t.reward} • cut {t.adminCut}% • {t.verifyType}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(t.id)} className="btn btn-ghost flex-1 text-xs">🔁 Toggle</button>
              <button onClick={() => del(t.id)} className="btn bg-red-500/20 text-red-400 flex-1 text-xs">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WdTab({ initData }: any) {
  const [list, setList] = useState<any[]>([])
  const load = () => fetch('/api/admin/withdrawals', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(d => d.ok && setList(d.withdrawals))
  useEffect(() => { load() }, [initData])

  const act = async (id: number, action: string) => {
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ id, action })
    })
    load()
  }

  return (
    <div className="p-4 space-y-2">
      {list.length === 0 && <p className="text-tg-muted text-center py-8">No withdrawals</p>}
      {list.map(w => (
        <div key={w.id} className="card space-y-2">
          <div className="flex justify-between">
            <div>
              <p className="font-medium text-sm">#{w.id} — {w.user?.firstName}</p>
              <p className="text-xs text-tg-muted">@{w.user?.username || 'user'}</p>
              <p className="text-xs text-tg-muted">{w.method} • {w.address}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-tg-primary">${fmtMoney(w.amount)}</p>
              <p className={cn('text-xs', w.status === 'pending' ? 'text-yellow-400' : w.status === 'approved' ? 'text-green-400' : 'text-red-400')}>{w.status}</p>
            </div>
          </div>
          {w.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => act(w.id, 'approve')} className="btn bg-green-500/20 text-green-400 flex-1 text-xs">✅ Approve</button>
              <button onClick={() => act(w.id, 'reject')} className="btn bg-red-500/20 text-red-400 flex-1 text-xs">❌ Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SettingsTab({ initData }: any) {
  const [s, setS] = useState<any>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(d => d.ok && setS(d.settings))
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

  const fields = [
    ['site_name', 'Site Name'],
    ['support_username', 'Support Username (without @)'],
    ['min_withdraw', 'Min Withdraw (USD)'],
    ['referral_percent', 'Referral %'],
    ['promote_commission', 'Promote Commission %'],
    ['force_channels', 'Force Channels (comma-separated)'],
    ['welcome_text', 'Welcome Text']
  ]

  return (
    <div className="p-4 space-y-3">
      {fields.map(([k, label]) => (
        <div key={k}>
          <label className="text-xs text-tg-muted">{label}</label>
          <input
            value={s[k] || ''}
            onChange={e => setS({ ...s, [k]: e.target.value })}
            className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2 mt-1 text-sm"
          />
        </div>
      ))}
      <button onClick={save} className="btn btn-primary w-full">{saved ? '✅ Saved!' : 'Save Settings'}</button>
    </div>
  )
}
