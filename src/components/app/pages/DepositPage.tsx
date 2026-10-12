'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, Check, CreditCard, Clock, XCircle, CheckCircle2 } from 'lucide-react'
import { cn, fmtMoney } from '@/lib/utils'
import { Spinner, ListSkeleton } from '@/components/ui/Loading'

const METHODS = [
  { id: 'binance', label: 'Binance UID', icon: '🟡', hint: 'Binance UID (Pay ID)' },
  { id: 'bep20', label: 'BEP20', icon: '🔷', hint: 'USDT BEP20 address' },
  { id: 'tonkeeper', label: 'Tonkeeper', icon: '💎', hint: 'TON wallet address' }
]

export default function DepositPage({ user, initData, onBack }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [txid, setTxid] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/user/deposit', { headers: { 'x-init-data': initData } })
    const d = await r.json()
    if (d.ok) setData(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [initData])

  const copyAddr = () => {
    if (!method || !data?.methods?.[method]) return
    navigator.clipboard.writeText(data.methods[method])
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const submit = async () => {
    if (!method || !amount || !txid) return
    setBusy(true); setMsg('')
    const r = await fetch('/api/user/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ amount: parseFloat(amount), method, txid })
    })
    const d = await r.json()
    setBusy(false)
    if (d.ok) {
      setMsg('✅ Deposit request submitted! Admin verify করলে balance এ যোগ হবে।')
      setAmount(''); setTxid(''); setMethod(null)
      load()
    } else {
      setMsg('❌ ' + (d.error || 'Failed'))
    }
  }

  const minDep = data?.minDeposit || 1

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-black">💳 Deposit</h1>
        <p className="text-xs text-muted mt-1">
          নিচের method থেকে পেমেন্ট করে TXID submit করুন
        </p>
      </div>

      {loading ? <ListSkeleton count={3} /> : (
        <>
          {/* Method cards */}
          {!method && (
            <div className="space-y-2">
              {METHODS.map(m => {
                const addr = data?.methods?.[m.id]
                const configured = addr && addr.trim()
                return (
                  <button
                    key={m.id}
                    disabled={!configured}
                    onClick={() => configured && setMethod(m.id)}
                    className={cn('card w-full flex items-center gap-3 text-left active:scale-98 transition',
                      !configured && 'opacity-50'
                    )}
                  >
                    <div className="w-11 h-11 rounded-xl bg-bg-soft flex items-center justify-center text-xl flex-shrink-0">
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{m.label}</p>
                      <p className="text-[10px] text-muted">{m.hint}</p>
                      {configured && (
                        <p className="text-[10px] text-brand font-mono truncate mt-1">{addr}</p>
                      )}
                      {!configured && <p className="text-[10px] text-red mt-1">Not configured by admin</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Form */}
          {method && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                  {METHODS.find(m => m.id === method)?.icon} {METHODS.find(m => m.id === method)?.label}
                </p>
                <button onClick={() => setMethod(null)} className="text-[10px] text-muted">Change</button>
              </div>

              <div className="bg-bg-soft rounded-xl p-3">
                <p className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Send payment to:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all flex-1">{data?.methods?.[method]}</code>
                  <button
                    onClick={copyAddr}
                    className="bg-brand text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95"
                  >
                    {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider font-bold">
                  Amount (USD) — min ${minDep}
                </label>
                <input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  min={minDep}
                  placeholder={`Min $${minDep}`}
                  className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-1 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider font-bold">
                  Transaction ID / Hash
                </label>
                <input
                  value={txid}
                  onChange={e => setTxid(e.target.value)}
                  placeholder="Paste TXID or reference"
                  className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-1 text-sm font-mono"
                />
              </div>

              <button
                onClick={submit}
                disabled={busy || !amount || !txid}
                className="btn btn-brand w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <><Spinner size={14} /> Submitting...</> : '💳 Submit Deposit'}
              </button>

              {msg && <p className="text-center text-xs">{msg}</p>}
            </div>
          )}

          {/* History */}
          {data?.deposits?.length > 0 && !method && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold px-1">Recent Deposits</p>
              {data.deposits.map((d: any) => (
                <div key={d.id} className="card flex items-center gap-3 py-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center',
                    d.status === 'approved' ? 'bg-green/15' :
                    d.status === 'pending' ? 'bg-gold/15' : 'bg-red/15'
                  )}>
                    {d.status === 'approved' ? <CheckCircle2 size={16} className="text-green" /> :
                     d.status === 'pending' ? <Clock size={16} className="text-gold" /> :
                     <XCircle size={16} className="text-red" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">${fmtMoney(d.amount)} — {d.method.toUpperCase()}</p>
                    <p className="text-[10px] text-muted truncate font-mono">{d.txid || '—'}</p>
                    {d.rejectReason && <p className="text-[10px] text-red">❌ {d.rejectReason}</p>}
                  </div>
                  <p className={cn('text-[10px] font-bold uppercase',
                    d.status === 'approved' ? 'text-green' :
                    d.status === 'pending' ? 'text-gold' : 'text-red'
                  )}>{d.status}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card-soft text-[10px] text-muted">
        💡 <b>How it works:</b> Payment পাঠান → TXID submit করুন → Admin verify করলে balance এ যোগ হবে
      </div>
    </div>
  )
}
