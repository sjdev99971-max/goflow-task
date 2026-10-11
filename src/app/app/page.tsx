'use client'

import { TelegramProvider, useTelegram } from '@/components/TelegramProvider'
import { useEffect, useState } from 'react'
import { Home, Wallet, Users, Trophy, User as UserIcon, ArrowLeft, ChevronRight, Gift, TrendingUp, DollarSign, Send, Clock, Headphones } from 'lucide-react'
import { fmtMoney, cn, initials } from '@/lib/utils'

const TASK_TYPES: Record<string, string> = {
  join_chat: '📢 Join Chat',
  bot: '🤖 Message Bot',
  view_post: '📄 View Post',
  micro: '🧑‍💻 Micro Task',
  x: '🚀 Follow X',
  tiktok: '🚨 TikTok',
  youtube: '🖇️ YouTube',
  instagram: '🕐 Instagram'
}

export default function AppPage() {
  return (
    <TelegramProvider>
      <AppInner />
    </TelegramProvider>
  )
}

function AppInner() {
  const { user, loading, initData } = useTelegram()
  const [tab, setTab] = useState('home')

  if (loading) return <Splash />
  if (!user) return <AuthError />

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {tab === 'home' && <HomeTab user={user} initData={initData} />}
      {tab === 'earnings' && <EarningsTab initData={initData} />}
      {tab === 'wallet' && <WalletTab user={user} initData={initData} />}
      {tab === 'referrals' && <ReferralsTab initData={initData} />}
      {tab === 'profile' && <ProfileTab user={user} initData={initData} />}

      <BottomNav tab={tab} setTab={setTab} isAdmin={user.isAdmin} />
    </div>
  )
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-tg-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-tg-muted">Loading...</p>
      </div>
    </div>
  )
}

function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card text-center max-w-sm">
        <p className="text-xl font-bold mb-2">⚠️ Auth Failed</p>
        <p className="text-tg-muted text-sm">এই App শুধু Telegram Bot থেকে খুলতে হবে।</p>
      </div>
    </div>
  )
}

// ---------- HOME ----------
function HomeTab({ user, initData }: any) {
  const [stats, setStats] = useState<any>(null)
  const { refresh } = useTelegram()

  useEffect(() => {
    fetch('/api/user/balance', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setStats)
  }, [initData])

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-3 pt-2">
        {user.photoUrl
          ? <img src={user.photoUrl} className="w-12 h-12 rounded-full border-2 border-tg-primary" alt="" />
          : <div className="w-12 h-12 rounded-full bg-tg-primary flex items-center justify-center text-lg font-bold">
              {initials(user.firstName, user.lastName)}
            </div>
        }
        <div className="flex-1">
          <p className="font-semibold">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-tg-muted">@{user.username || 'user'}</p>
        </div>
        {user.isAdmin && <span className="text-xs bg-tg-primary/20 text-tg-primary px-2 py-1 rounded-full">ADMIN</span>}
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-tg-primary to-purple-800 p-5 text-white shadow-lg shadow-tg-primary/20">
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-3xl font-bold mt-1">${fmtMoney(stats?.mainBalance ?? user.mainBalance)}</p>
        <div className="flex gap-4 mt-4 text-sm">
          <div>
            <p className="opacity-80 text-xs">Promote</p>
            <p className="font-semibold">${fmtMoney(stats?.promoteBalance ?? user.promoteBalance)}</p>
          </div>
          <div>
            <p className="opacity-80 text-xs">Earned</p>
            <p className="font-semibold">${fmtMoney(stats?.totalEarned ?? user.totalEarned)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <QuickAction icon={<DollarSign size={20} />} label="Earn" tab="earnings" />
        <QuickAction icon={<Send size={20} />} label="Withdraw" tab="wallet" />
        <QuickAction icon={<Users size={20} />} label="Refer" tab="referrals" />
        <QuickAction icon={<Trophy size={20} />} label="Top" tab="leaderboard" />
      </div>

      {/* Info cards */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <div>
              <p className="font-medium">Refer & Earn</p>
              <p className="text-xs text-tg-muted">Get 10% lifetime commission</p>
            </div>
          </div>
          <ChevronRight className="text-tg-muted" size={20} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tg-primary/20 flex items-center justify-center">
              <Gift className="text-tg-primary" size={20} />
            </div>
            <div>
              <p className="font-medium">Daily Tasks</p>
              <p className="text-xs text-tg-muted">Complete tasks to earn more</p>
            </div>
          </div>
          <ChevronRight className="text-tg-muted" size={20} />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, tab }: any) {
  return (
    <div className="card flex flex-col items-center py-3 gap-1 cursor-pointer">
      <div className="text-tg-primary">{icon}</div>
      <span className="text-xs">{label}</span>
    </div>
  )
}

// ---------- EARNINGS ----------
function EarningsTab({ initData }: any) {
  const [cat, setCat] = useState<string | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cat) return
    setLoading(true)
    fetch(`/api/user/tasks?type=${cat}`, { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(d => setTasks(d.tasks || []))
      .finally(() => setLoading(false))
  }, [cat, initData])

  if (!cat) {
    return (
      <div className="p-4 space-y-3">
        <h1 className="text-2xl font-bold pt-2">💸 Earnings</h1>
        <p className="text-tg-muted text-sm">Choose a category</p>
        <div className="space-y-2 mt-4">
          {Object.entries(TASK_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setCat(k)} className="card w-full flex items-center justify-between active:scale-98 transition">
              <span className="font-medium">{v}</span>
              <ChevronRight className="text-tg-muted" size={18} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <button onClick={() => setCat(null)} className="flex items-center gap-1 text-tg-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-bold">{TASK_TYPES[cat]}</h1>

      {loading ? <div className="text-center text-tg-muted py-8">Loading...</div> :
        tasks.length === 0 ? <div className="card text-center py-8 text-tg-muted">No tasks available</div> :
        tasks.map(t => <TaskCard key={t.id} task={t} initData={initData} />)
      }
    </div>
  )
}

function TaskCard({ task, initData }: any) {
  const [busy, setBusy] = useState(false)
  const [proof, setProof] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [msg, setMsg] = useState('')

  const done = task.completed === 'approved'
  const pending = task.completed === 'pending'
  const reward = +(task.reward * (1 - task.adminCut / 100)).toFixed(4)

  const submit = async () => {
    if (!proof) return
    setBusy(true)
    const res = await fetch('/api/user/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ taskId: task.id, proof })
    })
    const data = await res.json()
    setBusy(false)
    if (data.ok) { setMsg('✅ Submitted! Admin approve করলে credit পাবেন।'); setShowInput(false) }
    else setMsg('❌ ' + (data.error || 'Failed'))
  }

  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold">{task.title}</p>
          {task.description && <p className="text-xs text-tg-muted mt-1">{task.description}</p>}
        </div>
        <span className="text-tg-primary font-bold text-sm">${reward}</span>
      </div>

      <div className="flex gap-2">
        <a href={task.link} target="_blank" rel="noreferrer" className="btn btn-primary flex-1 text-center text-sm">
          🔗 Open
        </a>
        {!done && !pending && (
          task.verifyType === 'auto' ?
            <button onClick={() => { setShowInput(true); setMsg('Auto verify হবে না — screenshot দিন।') }} className="btn btn-ghost flex-1 text-sm">
              ✅ Verify
            </button> :
            <button onClick={() => setShowInput(!showInput)} className="btn btn-ghost flex-1 text-sm">
              📸 Submit Proof
            </button>
        )}
        {done && <span className="btn bg-green-500/20 text-green-400 flex-1 text-center text-sm">✅ Done</span>}
        {pending && <span className="btn bg-yellow-500/20 text-yellow-400 flex-1 text-center text-sm">⏳ Pending</span>}
      </div>

      {showInput && (
        <div className="space-y-2 pt-2 border-t border-tg-border">
          <input
            value={proof}
            onChange={e => setProof(e.target.value)}
            placeholder="Screenshot URL বা proof link"
            className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2 text-sm"
          />
          <button onClick={submit} disabled={busy || !proof} className="btn btn-primary w-full text-sm disabled:opacity-50">
            {busy ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}

      {msg && <p className="text-xs text-tg-muted">{msg}</p>}
    </div>
  )
}

// ---------- WALLET ----------
function WalletTab({ user, initData }: any) {
  const [bal, setBal] = useState<any>(null)
  const [mode, setMode] = useState<'view' | 'withdraw' | 'convert'>('view')
  const [method, setMethod] = useState('binance')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const { refresh } = useTelegram()

  useEffect(() => {
    fetch('/api/user/balance', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(setBal)
  }, [initData, msg])

  const submitWithdraw = async () => {
    setBusy(true); setMsg('')
    const res = await fetch('/api/user/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ amount: parseFloat(amount), method, address })
    })
    const d = await res.json()
    setBusy(false)
    if (d.ok) { setMsg('✅ Withdraw request submitted!'); setAmount(''); setAddress('') }
    else setMsg('❌ ' + (d.error || 'Failed'))
  }

  const convert = async () => {
    setBusy(true); setMsg('')
    const res = await fetch('/api/user/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ amount: parseFloat(amount) })
    })
    const d = await res.json()
    setBusy(false)
    if (d.ok) { setMsg('✅ Converted!'); setAmount('') }
    else setMsg('❌ ' + (d.error || 'Failed'))
    refresh()
  }

  if (mode === 'withdraw') {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setMode('view')} className="flex items-center gap-1 text-tg-muted text-sm pt-2">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-bold">📤 Withdraw</h1>

        <div className="card space-y-3">
          <div>
            <label className="text-xs text-tg-muted">Method</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[['binance', 'Binance UID'], ['bep20', 'BEP20'], ['tonkeeper', 'Tonkeeper']].map(([k, l]) => (
                <button key={k} onClick={() => setMethod(k)} className={cn('btn text-xs', method === k ? 'btn-primary' : 'btn-ghost')}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-tg-muted">Amount (min $0.20)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="0.20" className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-xs text-tg-muted">Address / UID</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address" className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2 mt-1" />
          </div>
          <button onClick={submitWithdraw} disabled={busy || !amount || !address} className="btn btn-primary w-full disabled:opacity-50">
            {busy ? 'Processing...' : 'Submit Request'}
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      </div>
    )
  }

  if (mode === 'convert') {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setMode('view')} className="flex items-center gap-1 text-tg-muted text-sm pt-2">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-bold">🔄 Main → Promote</h1>
        <div className="card space-y-3">
          <p className="text-sm text-tg-muted">Main Balance থেকে Promote এ নিন। Reverse সম্ভব না।</p>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount" className="w-full bg-tg-bg border border-tg-border rounded-xl px-3 py-2" />
          <button onClick={convert} disabled={busy || !amount} className="btn btn-primary w-full disabled:opacity-50">
            {busy ? 'Converting...' : 'Convert'}
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold pt-2">💰 Balance</h1>
      <div className="card space-y-3">
        <div>
          <p className="text-xs text-tg-muted">Main Balance</p>
          <p className="text-2xl font-bold text-tg-primary">${fmtMoney(bal?.mainBalance || 0)}</p>
        </div>
        <div className="border-t border-tg-border pt-3">
          <p className="text-xs text-tg-muted">Promote Balance</p>
          <p className="text-xl font-bold">${fmtMoney(bal?.promoteBalance || 0)}</p>
        </div>
        <div className="border-t border-tg-border pt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-tg-muted">Total Earned</p>
            <p className="font-semibold">${fmtMoney(bal?.totalEarned || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-tg-muted">Withdrawn</p>
            <p className="font-semibold">${fmtMoney(bal?.totalWithdrawn || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setMode('withdraw')} className="btn btn-primary">📤 Withdraw</button>
        <button onClick={() => setMode('convert')} className="btn btn-ghost">🔄 To Promote</button>
      </div>
    </div>
  )
}

// ---------- REFERRALS ----------
function ReferralsTab({ initData }: any) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/referrals', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(setData)
  }, [initData])

  const copy = () => {
    navigator.clipboard.writeText(data?.link || '')
    ;(window as any).Telegram?.WebApp?.showAlert('✅ Link copied!')
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold pt-2">👭 Referrals</h1>

      <div className="card">
        <p className="text-xs text-tg-muted mb-2">Your referral link</p>
        <div className="bg-tg-bg rounded-xl p-3 text-xs break-all font-mono">{data?.link || '...'}</div>
        <button onClick={copy} className="btn btn-primary w-full mt-3">📋 Copy Link</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-tg-muted">Referrals</p>
          <p className="text-2xl font-bold">{data?.count || 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-tg-muted">Earned</p>
          <p className="text-2xl font-bold text-green-400">${fmtMoney(data?.earned || 0)}</p>
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-medium mb-2">Lifetime {data?.percent || 10}% Commission</p>
        <p className="text-xs text-tg-muted">আপনার রেফার করা ইউজার যা ইনকাম করবে তার {data?.percent || 10}% সরাসরি আপনার Main Balance এ যোগ হবে।</p>
      </div>
    </div>
  )
}

// ---------- PROFILE ----------
function ProfileTab({ user, initData }: any) {
  const [data, setData] = useState<any>(null)
  const { initData: id } = useTelegram()

  useEffect(() => {
    fetch('/api/user/leaderboard?type=earners').then(r => r.json()).then(setData)
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold pt-2">👤 Profile</h1>

      <div className="card flex items-center gap-4">
        {user.photoUrl
          ? <img src={user.photoUrl} className="w-16 h-16 rounded-full border-2 border-tg-primary" alt="" />
          : <div className="w-16 h-16 rounded-full bg-tg-primary flex items-center justify-center text-2xl font-bold">
              {initials(user.firstName, user.lastName)}
            </div>
        }
        <div>
          <p className="font-bold text-lg">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-tg-muted">@{user.username || 'user'}</p>
          <p className="text-xs text-tg-muted">ID: {user.telegramId}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Earned" value={`$${fmtMoney(user.totalEarned)}`} />
        <StatCard label="Referrals" value={String(user.totalReferrals)} />
        <StatCard label="Balance" value={`$${fmtMoney(user.mainBalance)}`} />
      </div>

      {user.isAdmin && (
        <a href="/admin" className="card flex items-center justify-between text-tg-primary">
          <span>🛠️ Open Admin Panel</span>
          <ChevronRight size={18} />
        </a>
      )}
    </div>
  )
}

function StatCard({ label, value }: any) {
  return (
    <div className="card text-center py-3">
      <p className="text-xs text-tg-muted">{label}</p>
      <p className="font-bold text-sm mt-1">{value}</p>
    </div>
  )
}

// ---------- LEADERBOARD ----------
function LeaderboardTab({ initData }: any) {
  const [type, setType] = useState('earners')
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/user/leaderboard?type=${type}`).then(r => r.json()).then(d => setRows(d.rows || []))
  }, [type])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold pt-2">🏆 Leaderboard</h1>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setType('earners')} className={cn('btn', type === 'earners' ? 'btn-primary' : 'btn-ghost')}>💰 Earners</button>
        <button onClick={() => setType('referrers')} className={cn('btn', type === 'referrers' ? 'btn-primary' : 'btn-ghost')}>👭 Referrers</button>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="card flex items-center gap-3 py-3">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700' : 'bg-tg-border'
            )}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{r.firstName || 'User'}</p>
              <p className="text-xs text-tg-muted">@{r.username || 'user'}</p>
            </div>
            <p className="font-bold text-sm text-tg-primary">
              {type === 'earners' ? `$${fmtMoney(r.totalEarned)}` : `${r.totalReferrals} refs`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- BOTTOM NAV ----------
function BottomNav({ tab, setTab, isAdmin }: any) {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'earnings', icon: DollarSign, label: 'Earn' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'referrals', icon: Users, label: 'Refer' },
    { id: 'profile', icon: UserIcon, label: 'Profile' }
  ]

  // Leaderboard is reachable via home quick action
  if (tab === 'leaderboard') {
    // handled inline
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-tg-card/95 backdrop-blur border-t border-tg-border max-w-lg mx-auto">
      <div className="flex justify-around py-2">
        {items.map(it => {
          const Icon = it.icon
          const active = tab === it.id
          return (
            <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <Icon size={20} className={active ? 'text-tg-primary' : 'text-tg-muted'} />
              <span className={cn('text-[10px]', active ? 'text-tg-primary' : 'text-tg-muted')}>{it.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
