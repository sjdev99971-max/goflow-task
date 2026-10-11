'use client'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { ListSkeleton, Shimmer } from '@/components/ui/Loading'
import { cn } from '@/lib/utils'

export default function ActivityTab({ initData }: any) {
  const [tab, setTab] = useState('all')
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [promotes, setPromotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/withdraw', { headers: { 'x-init-data': initData } }).then(r => r.json()).catch(() => null),
      fetch('/api/user/promote', { headers: { 'x-init-data': initData } }).then(r => r.json()).catch(() => null)
    ]).then(([w, p]) => {
      if (w) setWithdrawals(w.withdrawals || [])
      if (p) setPromotes(p.promotes || [])
      setLoading(false)
    })
  }, [initData])

  const all = [
    ...withdrawals.map(w => ({ ...w, _kind: 'withdraw' })),
    ...promotes.map(p => ({ ...p, _kind: 'promote' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filtered = tab === 'all' ? all : all.filter(x => x._kind === tab)
  const totalIn = all.filter(x => x._kind === 'promote').reduce((s, x) => s + (x.commission || 0), 0)
  const totalOut = withdrawals.filter(w => w.status === 'approved').reduce((s, x) => s + x.amount, 0)

  return (
    <div className="p-4 space-y-3 animate-fade-in">
      <h1 className="text-2xl font-black pt-2">Activity</h1>

      {loading ? (
        <StatsSkeleton2 />
      ) : (
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          <div className="card-soft">
            <div className="flex items-center gap-1 text-green">
              <ArrowDownLeft size={14} />
              <span className="text-[10px] text-muted uppercase">Total In</span>
            </div>
            <p className="text-xl font-black text-green mt-1">${totalIn.toFixed(3)}</p>
          </div>
          <div className="card-soft">
            <div className="flex items-center gap-1 text-brand">
              <ArrowUpRight size={14} />
              <span className="text-[10px] text-muted uppercase">Withdrawn</span>
            </div>
            <p className="text-xl font-black text-brand mt-1">${totalOut.toFixed(3)}</p>
          </div>
        </div>
      )}

      <div className="bg-bg-soft rounded-xl p-1 flex">
        {[
          { id: 'all', label: 'ALL' },
          { id: 'promote', label: 'PROMOTES' },
          { id: 'withdraw', label: 'WITHDRAWS' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold ${tab === t.id ? 'bg-brand text-white' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-muted text-sm">No activity yet</div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {filtered.map(item => (
            <div key={`${item._kind}-${item.id}`} className="card flex items-center gap-3 py-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item._kind === 'withdraw' ? 'bg-brand/10' : 'bg-green/10'}`}>
                {item._kind === 'withdraw'
                  ? <ArrowUpRight size={16} className="text-brand" />
                  : <ArrowDownLeft size={16} className="text-green" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold capitalize">{item._kind}{item.method ? ` · ${item.method}` : ''}</p>
                <p className="text-[10px] text-muted">
                  {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${item._kind === 'withdraw' ? 'text-brand' : 'text-green'}`}>
                  {item._kind === 'withdraw' ? '-' : '+'}${item.amount?.toFixed(3)}
                </p>
                <p className={`text-[10px] ${item.status === 'approved' ? 'text-green' : item.status === 'pending' ? 'text-gold' : 'text-red'}`}>
                  {item.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatsSkeleton2() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2].map(i => (
        <div key={i} className="card-soft space-y-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}
