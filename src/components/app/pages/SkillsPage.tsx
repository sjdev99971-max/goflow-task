'use client'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Circle, Award } from 'lucide-react'

const SKILLS = [
  { id: 'profile', label: 'Complete your profile', desc: 'Photo + username' },
  { id: 'first_task', label: 'Complete first task', desc: 'Any task from Task Center' },
  { id: 'refer_1', label: 'Refer 1 friend', desc: 'Share your referral link' },
  { id: 'refer_5', label: 'Refer 5 friends', desc: 'Grow your network' },
  { id: 'checkin_7', label: 'Check-in 7 days', desc: 'Maintain 7 day streak' },
  { id: 'earn_1', label: 'Earn $1 total', desc: 'Complete paid tasks' }
]

export default function SkillsPage({ user, initData, onBack }: any) {
  const [done, setDone] = useState<string[]>(() => {
    const list: string[] = []
    if (user.photoUrl) list.push('profile')
    if (user.totalEarned > 0) list.push('first_task')
    if (user.totalReferrals >= 1) list.push('refer_1')
    if (user.totalReferrals >= 5) list.push('refer_5')
    if (user.totalEarned >= 1) list.push('earn_1')
    return list
  })

  const progress = Math.round(done.length / SKILLS.length * 100)

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-black">Skills Verification</h1>
      <p className="text-xs text-muted">সম্পূর্ণ করলে exclusive skills unlock হবে</p>

      <div className="card text-center">
        <Award size={32} className="mx-auto text-brand mb-2" />
        <p className="text-3xl font-black text-brand">{progress}%</p>
        <p className="text-xs text-muted mt-1">Overall Progress</p>
        <div className="mt-3 h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full gradient-brand rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {SKILLS.map(s => {
          const isDone = done.includes(s.id)
          return (
            <div key={s.id} className="card flex items-center gap-3">
              {isDone
                ? <CheckCircle2 size={22} className="text-green flex-shrink-0" />
                : <Circle size={22} className="text-muted flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isDone ? 'line-through text-muted' : ''}`}>{s.label}</p>
                <p className="text-[10px] text-muted">{s.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
