'use client'
import { ArrowLeft, Bell, CheckCircle2, Info } from 'lucide-react'

export default function NotificationsPage({ initData, onBack }: any) {
  const notifications = [
    { icon: <CheckCircle2 size={16} className="text-green" />, title: 'Welcome to FoxiTask', desc: 'Start completing tasks to earn USDT', time: 'now' },
    { icon: <Info size={16} className="text-brand" />, title: 'Daily Check-in available', desc: 'Come back every day for bonus', time: 'today' },
    { icon: <Bell size={16} className="text-gold" />, title: 'New tasks added', desc: 'Check Task Center for new opportunities', time: 'today' }
  ]

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-black">Notifications</h1>

      <div className="space-y-2">
        {notifications.map((n, i) => (
          <div key={i} className="card flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center flex-shrink-0">
              {n.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{n.title}</p>
              <p className="text-xs text-muted mt-0.5">{n.desc}</p>
            </div>
            <span className="text-[10px] text-dim">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
