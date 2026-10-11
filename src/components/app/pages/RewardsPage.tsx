'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, Gift, Users, Zap, Trophy } from 'lucide-react'

export default function RewardsPage({ user, initData, onBack }: any) {
  const [refData, setRefData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/referrals', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setRefData)
  }, [initData])

  const perks = [
    { icon: <Gift size={20} />, label: 'Daily Bonus', value: '7 day streak rewards', unlocked: true },
    { icon: <Users size={20} />, label: 'Referral Commission', value: `${refData?.percent || 10}% lifetime`, unlocked: true },
    { icon: <Zap size={20} />, label: 'Task Booster', value: 'Complete 50 tasks', unlocked: user.totalEarned >= 5 },
    { icon: <Trophy size={20} />, label: 'Top 100 Badge', value: 'Reach top 100 earners', unlocked: false }
  ]

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-black">Rewards</h1>

      <div className="card-soft text-center">
        <p className="text-xs text-muted">Total Earned</p>
        <p className="text-4xl font-black text-brand mt-1">${(user.totalEarned || 0).toFixed(3)}</p>
        <p className="text-xs text-muted mt-1">USDT</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-brand">{user.totalReferrals || 0}</p>
          <p className="text-[10px] text-muted mt-1">Referrals</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-gold">${(refData?.earned || 0).toFixed(3)}</p>
          <p className="text-[10px] text-muted mt-1">From Referrals</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted uppercase tracking-wider px-1">Perks</p>
        {perks.map((p, i) => (
          <div key={i} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.unlocked ? 'bg-brand/15 text-brand' : 'bg-bg-soft text-muted'}`}>
              {p.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{p.label}</p>
              <p className="text-[10px] text-muted">{p.value}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.unlocked ? 'bg-green/20 text-green' : 'bg-bg-soft text-muted'}`}>
              {p.unlocked ? 'ACTIVE' : 'LOCKED'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
