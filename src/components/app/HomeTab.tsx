'use client'
import { useEffect, useState } from 'react'
import { Bell, ChevronRight, Trophy, Gift, Zap, Info } from 'lucide-react'
import { fmtMoney, initials, cn } from '@/lib/utils'

export default function HomeTab({ user, initData, setTab }: any) {
  const [stats, setStats] = useState<any>(null)
  const [publicStats, setPublicStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/balance', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/public/stats').then(r => r.json()).then(d => setPublicStats(d.stats)).catch(() => {})
  }, [initData])

  const balance = stats?.mainBalance ?? user.mainBalance ?? 0
  const level = Math.floor((user.totalEarned || 0) / 50) + 1
  const levelTier = level < 5 ? 'Newbie' : level < 15 ? 'Rookie' : level < 30 ? 'Pro' : 'Elite'

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="relative">
          {user.photoUrl
            ? <img src={user.photoUrl} className="w-11 h-11 rounded-full border-2 border-brand" alt="" />
            : <div className="w-11 h-11 rounded-full gradient-brand flex items-center justify-center font-bold">
                {initials(user.firstName, user.lastName)}
              </div>
          }
          <div className="absolute -bottom-0.5 -right-0.5 bg-brand text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-bg">
            {level}
          </div>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">👋 Hi, {user.firstName || 'User'}</p>
          <p className="text-[10px] text-muted">{levelTier} • Lv.{level}</p>
        </div>
        <button className="w-9 h-9 rounded-full bg-bg-card border border-line flex items-center justify-center">
          <Bell size={16} className="text-muted" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-soft text-center py-3">
          <p className="text-xl font-black text-brand">{fmtMoney(balance)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">USDT</p>
        </div>
        <div className="card-soft text-center py-3">
          <p className="text-xl font-black text-gold">{fmtMoney(user.totalEarned || 0)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Earned</p>
        </div>
        <div className="card-soft text-center py-3">
          <p className="text-xl font-black">{user.totalReferrals || 0}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Referrals</p>
        </div>
      </div>

      {/* Live Ticker */}
      <div className="card-soft flex items-center gap-2 py-2.5 overflow-hidden">
        <div className="w-6 h-6 rounded-full bg-green text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0">
          {user.firstName?.[0]?.toUpperCase() || 'A'}
        </div>
        <p className="text-[11px] truncate">
          <span className="text-muted">A user just withdrew </span>
          <span className="text-brand font-bold">$2.16 USDT</span>
        </p>
      </div>

      {/* Daily Check-in */}
      <button className="card-soft w-full flex items-center justify-between active:scale-98 transition">
        <div className="text-left">
          <p className="text-sm font-bold">Daily Check-in</p>
          <p className="text-[10px] text-muted mt-0.5">Total 7 days | Streak 5 days</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-full bg-brand/10 text-[10px] font-bold text-brand">🎁 0</div>
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            <span className="text-xs">✅</span>
          </div>
        </div>
      </button>

      {/* Prize Pool Card */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          <span className="text-brand">LIVE</span>
        </div>
        <div className="absolute top-3 right-3 text-[10px] text-muted">⏱ 7d 2h left</div>

        <div className="pt-6">
          <h3 className="text-lg font-black">Split the prize pool</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-black text-brand">200.00</span>
            <span className="text-xs font-bold text-brand">USDT</span>
          </div>
          <p className="text-[11px] text-muted mt-1">2 activities · Total pool this period</p>

          <div className="mt-4 flex items-center justify-between text-[11px]">
            <span className="text-txt-soft">Qualify in any activity to join</span>
            <span className="text-muted">0 / 2 qualified</span>
          </div>

          <div className="mt-2 flex gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-line overflow-hidden">
              <div className="h-full w-0 bg-brand rounded-full" />
            </div>
            <div className="h-1 flex-1 rounded-full bg-line overflow-hidden">
              <div className="h-full w-0 bg-brand rounded-full" />
            </div>
          </div>

          <button className="btn btn-brand w-full mt-4 text-sm flex items-center justify-center gap-2">
            Join the split <span>↗</span>
          </button>

          <p className="text-[10px] text-muted text-center mt-2">
            Rewards are shared by the rules when the period ends
          </p>
        </div>

        {/* Decorative coins */}
        <div className="absolute right-2 bottom-20 opacity-30 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-brand/30 blur-xl" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setTab('tasks')} className="card-soft text-center py-4 active:scale-95 transition">
          <Zap size={20} className="mx-auto text-brand mb-1" />
          <p className="text-[11px] font-semibold">Earn Tasks</p>
        </button>
        <button onClick={() => setTab('rank')} className="card-soft text-center py-4 active:scale-95 transition">
          <Trophy size={20} className="mx-auto text-gold mb-1" />
          <p className="text-[11px] font-semibold">Leaderboard</p>
        </button>
        <button onClick={() => setTab('profile')} className="card-soft text-center py-4 active:scale-95 transition">
          <Gift size={20} className="mx-auto text-brand mb-1" />
          <p className="text-[11px] font-semibold">Rewards</p>
        </button>
      </div>

      {/* Global Stats */}
      {publicStats && (
        <div className="card-soft">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-brand" />
            <p className="text-xs font-bold">Global Stats</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-lg font-black text-brand">{publicStats.totalTasks.toLocaleString()}</p>
              <p className="text-[10px] text-muted">Total Tasks</p>
            </div>
            <div>
              <p className="text-lg font-black text-green">${(publicStats.totalRewards / 1000).toFixed(1)}K</p>
              <p className="text-[10px] text-muted">Total Rewards</p>
            </div>
            <div>
              <p className="text-lg font-black text-gold">{publicStats.totalUsers.toLocaleString()}</p>
              <p className="text-[10px] text-muted">Users</p>
            </div>
            <div>
              <p className="text-lg font-black">{publicStats.runningDays}D</p>
              <p className="text-[10px] text-muted">Running</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
