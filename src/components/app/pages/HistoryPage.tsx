'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/Loading'

export default function HistoryPage({ initData, onBack }: any) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/history', { headers: { 'x-init-data': initData } })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .finally(() => setLoading(false))
  }, [initData])

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-black">Task History</h1>

      {loading ? (
        <ListSkeleton count={6} />
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-muted text-sm">এখনো কোনো history নেই</div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {items.map(item => (
            <div key={item.id} className="card flex items-center gap-3 py-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                item.status === 'approved' ? 'bg-green/15' : item.status === 'pending' ? 'bg-gold/15' : 'bg-red/15'
              }`}>
                {item.status === 'approved' ? <CheckCircle2 size={16} className="text-green" /> :
                 item.status === 'pending' ? <Clock size={16} className="text-gold" /> :
                 <XCircle size={16} className="text-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
                <p className="text-[10px] text-muted capitalize">{item.type?.replace('_', ' ')} • {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${item.status === 'approved' ? 'text-green' : 'text-muted'}`}>+${item.reward?.toFixed(3)}</p>
                <p className="text-[10px] text-muted">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
