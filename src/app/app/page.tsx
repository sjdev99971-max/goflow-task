'use client'

import { TelegramProvider, useTelegram } from '@/components/TelegramProvider'
import { useEffect, useState } from 'react'
import { Home, Wallet, Users, Trophy, User as UserIcon, ArrowLeft, ChevronRight, Gift, TrendingUp, DollarSign, Send } from 'lucide-react'
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
  const { user, loading, error, initData } = useTelegram()
  const [tab, setTab] = useState('home')

  if (loading) return <Splash />
  if (error) return <ErrorScreen message={error} />
  if (!user) return <ErrorScreen message="User data পাওয়া যায়নি। Telegram bot এর Menu button থেকে আবার খুলুন।" />

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {tab === 'home' && <HomeTab user={user} initData={initData} setTab={setTab} />}
      {tab === 'earnings' && <EarningsTab initData={initData} />}
      {tab === 'wallet' && <WalletTab user={user} initData={initData} />}
      {tab === 'referrals' && <ReferralsTab initData={initData} />}
      {tab === 'profile' && <ProfileTab user={user} initData={initData} />}
      {tab === 'leaderboard' && <LeaderboardTab initData={initData} />}

      <BottomNav tab={tab} setTab={setTab} />
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

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card text-center max-w-sm">
        <p className="text-3xl mb-2">⚠️</p>
        <p className="text-lg font-bold mb-2">Auth Failed</p>
        <p className="text-tg-muted text-sm break-words whitespace-pre-wrap">{message}</p>
        <p className="text-xs text-tg-muted mt-4">Telegram bot এর 🚀 Open App button থেকে আবার try করুন।</p>
      </div>
    </div>
  )
}

function HomeTab({ user, initData, setTab }: any) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/balance', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setStats).catch(() => {})
  }, [initData])

  return (
    <div className="p-4 space-y-4">
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

      <div className="grid grid-cols-4 gap-2">
        <QuickAction icon={<DollarSign size={20} />} label="Earn" onClick={() => setTab('earnings')} />
        <QuickAction icon={<Send size={20} />} label="Withdraw" onClick={() => setTab('wallet')} />
        <QuickAction icon={<Users size={20} />} label="Refer" onClick={() => setTab('referrals')} />
        <QuickAction icon={<Trophy size={20} />} label="Top" onClick={() => setTab('leaderboard')} />
      </div>

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

function QuickAction({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="card flex flex-col items-center py-3 gap-1 active:scale-95 transition">
      <div className="text-tg-primary">{icon}</div>
      <span className="text-xs">{label}</span>
    </button>
  )
}

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
            <button key={k} onClick={() => setCat(k)} className="card w-full flex items-center justify-between">
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
        tasks.map(t => (
          <div key={t.id} className="card space-y-2">
            <div className="flex justify-between">
              <p className="font-semibold">{t.title}</p>
              <span className="text-tg-primary font-bold text-sm">${t.reward}</span>
            </div>
            <a href={t.link} target="_blank" rel="noreferrer" className="btn btn-primary block text-center text-sm">🔗 Open</a>
          </div>
        ))
      }
    </div>
  )
}

function WalletTab({ user, initData }: any) {
  const [bal, setBal] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/balance', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(setBal)
  }, [initData])

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
      </div>
    </div>
  )
}

function ReferralsTab({ initData }: any) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/referrals', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(setData)
  }, [initData])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold pt-2">👭 Referrals</h1>
      <div className="card">
        <p className="text-xs text-tg-muted mb-2">Your referral link</p>
        <div className="bg-tg-bg rounded-xl p-3 text-xs break-all font-mono">{data?.link || '...'}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-xs text-tg-muted">Referrals</p><p className="text-2xl font-bold">{data?.count || 0}</p></div>
        <div className="card"><p className="text-xs text-tg-muted">Earned</p><p className="text-2xl font-bold text-green-400">${fmtMoney(data?.earned || 0)}</p></div>
      </div>
    </div>
  )
}

function ProfileTab({ user, initData }: any) {
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
        <div className="card text-center py-3"><p className="text-xs text-tg-muted">Earned</p><p className="font-bold text-sm mt-1">${fmtMoney(user.totalEarned)}</p></div>
        <div className="card text-center py-3"><p className="text-xs text-tg-muted">Referrals</p><p className="font-bold text-sm mt-1">{user.totalReferrals}</p></div>
        <div className="card text-center py-3"><p className="text-xs text-tg-muted">Balance</p><p className="font-bold text-sm mt-1">${fmtMoney(user.mainBalance)}</p></div>
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
            )}>{i + 1}</div>
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

function BottomNav({ tab, setTab }: any) {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'earnings', icon: DollarSign, label: 'Earn' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'referrals', icon: Users, label: 'Refer' },
    { id: 'profile', icon: UserIcon, label: 'Profile' }
  ]

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
