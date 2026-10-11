'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CheckInPage({ user, initData, onBack }: any) {
  const [data, setData] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    fetch('/api/user/checkin', { headers: { 'x-init-data': initData } })
      .then(r => r.json()).then(setData)
  }

  useEffect(() => { load() }, [initData])

  const doCheck = async () => {
    setBusy(true); setMsg('')
    const res = await fetch('/api/user/checkin', {
      method: 'POST', headers: { 'x-init-data': initData }
    })
    const d = await res.json()
    setBusy(false)
    if (d.ok) { setMsg(`✅ Day ${d.day} check-in complete! +$${d.reward}`); load() }
    else setMsg('❌ ' + (d.error || 'Failed'))
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-black">Daily Check-in</h1>
      <p className="text-xs text-muted">প্রতিদিন check-in করে bonus নিন। ৭ দিন streak হলে সবচেয়ে বেশি।</p>

      {data && (
        <>
          <div className="card">
            <div className="grid grid-cols-7 gap-1.5">
              {data.rewards.map((r: number, i: number) => {
                const done = i < data.streak
                const today = i === data.dayNumber - 1 && data.canCheck
                return (
                  <div key={i} className={cn(
                    'rounded-xl py-2 text-center',
                    done ? 'bg-green/20 border border-green/40' :
                    today ? 'bg-brand text-white' : 'bg-bg-soft border border-line'
                  )}>
                    <p className="text-[9px] opacity-70">Day {i + 1}</p>
                    {done ? <Check size={14} className="mx-auto text-green mt-1" /> :
                     <p className="text-[10px] font-bold mt-1">${r}</p>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card text-center">
            <p className="text-xs text-muted">Current Streak</p>
            <p className="text-4xl font-black text-brand">{data.streak}</p>
            <p className="text-xs text-muted mt-1">days</p>
          </div>

          <button
            onClick={doCheck}
            disabled={!data.canCheck || busy}
            className={cn('btn w-full text-base', data.canCheck ? 'btn-brand' : 'bg-bg-soft border border-line text-muted')}
          >
            {data.canCheck ? (busy ? 'Checking...' : '✅ Check In Now') : '⏰ Already checked today'}
          </button>

          {msg && <p className="text-center text-sm">{msg}</p>}
        </>
      )}
    </div>
  )
}
