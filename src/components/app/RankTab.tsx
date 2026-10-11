'use client'
import { useEffect, useState } from 'react'
import { Copy, Share2, Trophy, Users, TrendingUp } from 'lucide-react'
import { cn, fmtMoney } from '@/lib/utils'
import { RankSkeleton, Shimmer, StatsSkeleton } from '@/components/ui/Loading'

export default function RankTab({ user, initData }: any) {
  const [tab, setTab] = useState('tasks')
  const [refData, setRefData] = useState<any>(null)
  const [earners, setEarners] = useState<any[]>([])
  const [referrers, setReferrers] = useState<any[]>([])
  const [publicStats, setPublicStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/referrals', { headers: { 'x-init-data': initData } }).then(r => r.json()).then(setRefData).catch(() => {})
    fetch('/api/user/leaderboard?type=earners').then(r => r.json()).then(d => setEarners(d.rows || []))
    fetch('/api/user/leaderboard?type=referrers').then(r => r.json()).then(d => setReferrers(d.rows || []))
    fetch('/api/public/stats').then(r => r.json()).then(d => setPublicStats(d.stats))
  }, [initData])

  const copyLink = () => {
    if (refData?.link) {
      navigator.clipboard.writeText(refData.link)
      ;(window as any).Telegram?.WebApp?.showAlert('✅ Link copied!')
    }
  }

  const shareLink = () => {
    if (refData?.link) {
      const text = `🚀 Join FoxiTask and earn real USDT!\n${refData.link}`
      const url = `https://t.me/share/url?url=${encodeURIComponent(refData.link)}&text=${encodeURIComponent('🚀 Join FoxiTask and earn USDT!')}`
      ;(window as any).Telegram?.WebApp?.openTelegramLink(url)
    }
  }

  const rows = tab === 'tasks' ? earners : referrers
  const loading = earners.length === 0 && referrers.length === 0

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-black pt-2">Leaderboard <span className="text-muted text-sm">?</span></h1>

      {/* Invite Card */}
      <div className="card">
        <p className="text-sm font-bold mb-3">Invite Friends</p>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-lg font-black text-green">${fmtMoney(user.totalEarned * 0.1 || 0)}</p>
            <p className="text-[10px] text-muted">Commission</p>
          </div>
          <div>
            <p className="text-lg font-black">{refData?.count || 0}/{refData?.count || 0}</p>
            <p className="text-[10px] text-muted">Invited</p>
          </div>
          <div>
            <p className="text-lg font-black text-brand">{refData?.percent || 10}%</p>
            <p className="text-[10px] text-muted">Commission Rate</p>
          </div>
        </div>

        <div className="bg-bg-soft rounded-xl p-3 flex items-center gap-2 mb-2">
          <p className="text-[10px] text-muted truncate flex-1 font-mono">{refData?.link || '...'}</p>
          <button onClick={copyLink} className="bg-brand text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
            COPY
          </button>
        </div>

        <button onClick={shareLink} className="btn btn-brand w-full flex items-center justify-center gap-2 text-sm">
          <Share2 size={14} /> SHARE TO TELEGRAM
        </button>
      </div>

      {/* Stats */}
      {publicStats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="card-soft text-center py-3">
            <p className="text-sm font-black text-brand">{(publicStats.totalTasks / 1000).toFixed(1)}K</p>
            <p className="text-[9px] text-muted mt-0.5">Tasks</p>
          </div>
          <div className="card-soft text-center py-3">
            <p className="text-sm font-black text-green">${(publicStats.totalRewards / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted mt-0.5">Rewards</p>
          </div>
          <div className="card-soft text-center py-3">
            <p className="text-sm font-black text-gold">{(publicStats.totalUsers / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted mt-0.5">Users</p>
          </div>
          <div className="card-soft text-center py-3">
            <p className="text-sm font-black">{publicStats.runningDays}D</p>
            <p className="text-[9px] text-muted mt-0.5">Running</p>
          </div>
        </div>
      )}

      {/* Segment */}
      <div className="bg-bg-soft rounded-xl p-1 flex">
        <button onClick={() => setTab('tasks')} className={cn('flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1', tab === 'tasks' ? 'bg-brand text-white' : 'text-muted')}>
          <Trophy size={12} /> TASKS
        </button>
        <button onClick={() => setTab('invites')} className={cn('flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1', tab === 'invites' ? 'bg-brand text-white' : 'text-muted')}>
          <Users size={12} /> INVITES
        </button>
        <button className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 text-muted">
          <TrendingUp size={12} /> WEEKLY
        </button>
      </div>

      {/* My Rank */}
      <div className="card flex items-center gap-3">
        <div className="text-center min-w-[60px]">
          <p className="text-[10px] text-muted uppercase">MY RANK</p>
          <p className="text-xl font-black text-brand">#1</p>
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {user.photoUrl
            ? <img src={user.photoUrl} className="w-8 h-8 rounded-full" alt="" />
            : <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold">
                {user.firstName?.[0] || 'U'}
              </div>
          }
          <p className="text-sm font-bold truncate">{user.firstName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-gold">${fmtMoney(user.totalEarned)}</p>
          <p className="text-[9px] text-muted">USDT</p>
        </div>
      </div>

      {/* Top List */}
      {loading ? <RankSkeleton /> : (
      <div className="space-y-2 animate-fade-in">
        {rows.map((r, i) => (
          <div key={i} className="card flex items-center gap-3 py-3">
            <div className="text-center min-w-[36px]">
              {i < 3 ? (
                <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
              ) : (
                <span className="text-xs font-bold text-muted">#{i + 1}</span>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {r.photoUrl
                ? <img src={r.photoUrl} className="w-8 h-8 rounded-full" alt="" />
                : <div className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center text-xs font-bold">
                    {r.firstName?.[0] || 'U'}
                  </div>
              }
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{r.firstName || 'User'}</p>
                <p className="text-[10px] text-muted">
                  {tab === 'tasks' ? `${r.totalReferrals || 0} tasks` : `${r.totalReferrals || 0} referrals`}
                </p>
              </div>
            </div>
            <p className={cn('text-sm font-black', i < 3 ? 'text-gold' : 'text-brand')}>
              {tab === 'tasks' ? `$${fmtMoney(r.totalEarned)}` : `${r.totalReferrals}`}
            </p>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
