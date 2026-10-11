'use client'
import { useEffect, useState } from 'react'
import { Bell, Trophy, Gift, Zap, Info, Rocket } from 'lucide-react'
import { fmtMoney, initials, cn } from '@/lib/utils'
import { Shimmer, StatsSkeleton, CardSkeleton } from '@/components/ui/Loading'

export default function HomeTab({ user, initData, setTab, setPage }: any) {
  const [stats, setStats] = useState<any>(null)
  const [publicStats, setPublicStats] = useState<any>(null)
  const [checkin, setCheckin] = useState<any>(null)
  const [refData, setRefData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/balance', { headers: { 'x-init-data': initData } }).then(r => r.json()).catch(() => null),
      fetch('/api/public/stats').then(r => r.json()).catch(() => null),
      fetch('/api/user/checkin', { headers: { 'x-init-data': initData } }).then(r => r.json()).catch(() => null),
      fetch('/api/user/referrals', { headers: { 'x-init-data': initData } }).then(r => r.json()).catch(() => null)
    ]).then(([b, p, c, r]) => {
      if (b) setStats(b)
      if (p) setPublicStats(p.stats)
      if (c) setCheckin(c)
      if (r) setRefData(r)
      setLoading(false)
    })
  }, [initData])

  const balance = stats?.mainBalance ?? user.mainBalance ?? 0
  const level = Math.floor((user.totalEarned || 0) / 50) + 1
  const levelTier = level < 5 ? 'Newbie' : level < 15 ? 'Rookie' : level < 30 ? 'Pro' : 'Elite'

  return (
    <div className="p-4 space-y-3 animate-fade-in">
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
        <button onClick={() => setPage('notifications')} className="w-9 h-9 rounded-full bg-bg-card border border-line flex items-center justify-center active:scale-95 transition">
          <Bell size={16} className="text-muted" />
        </button>
      </div>

      {/* Stats Row */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
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
      )}

      {/* Daily Check-in */}
      {loading ? (
        <Shimmer className="h-16 w-full" />
      ) : (
        <button
          onClick={() => setPage('checkin')}
          className="card-soft w-full flex items-center justify-between active:scale-98 transition animate-fade-in"
        >
          <div className="text-left">
            <p className="text-sm font-bold">Daily Check-in</p>
            <p className="text-[10px] text-muted mt-0.5">
              Streak {checkin?.streak || 0} days {checkin?.canCheck ? '• Available now!' : '• Tomorrow'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-brand/10 text-[10px] font-bold text-brand">🎁</div>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', checkin?.canCheck ? 'bg-brand animate-pulse' : 'bg-green/20')}>
              <span className="text-xs">{checkin?.canCheck ? '!' : '✅'}</span>
            </div>
          </div>
        </button>
      )}

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
        <button onClick={() => setPage('rewards')} className="card-soft text-center py-4 active:scale-95 transition">
          <Gift size={20} className="mx-auto text-brand mb-1" />
          <p className="text-[11px] font-semibold">Rewards</p>
        </button>
      </div>

      {/* Referral Card */}
      {loading ? (
        <CardSkeleton rows={3} />
      ) : (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">Refer & Earn</p>
            <span className="text-[10px] text-brand font-bold">{refData?.percent || 10}% lifetime</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-black text-brand">{user.totalReferrals || 0}</p>
              <p className="text-[10px] text-muted">Invited</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-green">${(refData?.earned || 0).toFixed(3)}</p>
              <p className="text-[10px] text-muted">Earned</p>
            </div>
          </div>
          <button onClick={() => setTab('rank')} className="btn btn-brand w-full text-sm">
            Invite Friends →
          </button>
        </div>
      )}

      {/* Promote Card */}
      <button
        onClick={() => setPage('promote')}
        className="card w-full text-left active:scale-98 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 glow-brand">
            <Rocket size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black">Promote Now</p>
            <p className="text-[10px] text-muted">Channel, Group, Bot, Post promote করুন</p>
          </div>
          <span className="text-[10px] bg-brand text-white px-2 py-1 rounded-full font-bold">HOT</span>
        </div>
      </button>

      {/* Global Stats */}
      {loading ? (
        <CardSkeleton rows={4} />
      ) : publicStats ? (
        <div className="card-soft animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-brand" />
            <p className="text-xs font-bold">Global Stats</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-lg font-black text-brand">{publicStats.totalTasks.toLocaleString()}</p>
              <p className="text-[10px] text-muted">Tasks Done</p>
            </div>
            <div>
              <p className="text-lg font-black text-green">${publicStats.totalRewards.toFixed(2)}</p>
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
      ) : null}
    </div>
  )
}
