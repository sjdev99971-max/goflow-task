'use client'
import { useState } from 'react'
import { ArrowLeft, Rocket, Send, Users, Bot as BotIcon, FileText, Globe, Check, Info } from 'lucide-react'
import { cn, fmtMoney } from '@/lib/utils'
import { Spinner } from '@/components/ui/Loading'

const TYPES = [
  { id: 'channel', label: 'Telegram Channel', icon: <Send size={18} />, placeholder: '@yourchannel', auto: true },
  { id: 'group', label: 'Telegram Group', icon: <Users size={18} />, placeholder: '@yourgroup', auto: true },
  { id: 'bot', label: 'Telegram Bot', icon: <BotIcon size={18} />, placeholder: '@yourbot', auto: true },
  { id: 'post', label: 'Post Boost', icon: <FileText size={18} />, placeholder: 'https://t.me/yourchannel/123', auto: false },
  { id: 'other', label: 'Other Platform', icon: <Globe size={18} />, placeholder: 'https://...', auto: false }
]

export default function PromotePage({ user, initData, onBack, setPage }: any) {
  const [step, setStep] = useState<'select' | 'form' | 'done'>('select')
  const [type, setType] = useState<string | null>(null)
  const [link, setLink] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [result, setResult] = useState<any>(null)

  const selected = TYPES.find(t => t.id === type)
  const commission = amount ? +(parseFloat(amount) * 0.2).toFixed(4) : 0
  const actual = amount ? +(parseFloat(amount) - commission).toFixed(4) : 0

  const submit = async () => {
    if (!type || !link || !amount) return
    setBusy(true); setMsg('')
    const r = await fetch('/api/user/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ type, link, amount: parseFloat(amount) })
    })
    const d = await r.json()
    setBusy(false)
    if (d.ok) {
      setResult({ type: selected?.label, link, amount: parseFloat(amount), commission, actual })
      setStep('done')
    } else {
      setMsg('❌ ' + (d.error || d.message || 'Failed'))
    }
  }

  if (step === 'done' && result) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card text-center py-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center mx-auto animate-scale-in">
            <Check size={32} className="text-green" />
          </div>
          <p className="text-lg font-black">Promote Request Submitted!</p>
          <p className="text-xs text-muted">Admin verify করলে campaign চালু হবে</p>

          <div className="bg-bg-soft rounded-xl p-4 text-left space-y-2 mt-4">
            <Row label="Type" value={result.type} />
            <Row label="Link" value={result.link} mono />
            <Row label="Amount" value={`$${result.amount}`} />
            <Row label="Commission (20%)" value={`−$${result.commission}`} color="text-red" />
            <div className="pt-2 border-t border-line">
              <Row label="Active Promote" value={`$${result.actual}`} color="text-green font-black" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'form' && selected) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <button onClick={() => setStep('select')} className="flex items-center gap-1 text-muted text-sm pt-2">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-black flex items-center gap-2">
          {selected.icon} {selected.label}
        </h1>

        <div className="card space-y-4">
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Link / Username</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder={selected.placeholder}
              className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:border-brand"
            />
            {selected.auto && (
              <p className="text-[10px] text-green mt-1">✓ Auto-verify হবে (Telegram API)</p>
            )}
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-bold">Amount (USD)</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              step="0.1"
              min="1"
              placeholder="Min $1"
              className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 mt-1 text-sm font-mono focus:outline-none focus:border-brand"
            />
          </div>

          {amount && parseFloat(amount) >= 1 && (
            <div className="bg-bg-soft rounded-xl p-3 space-y-1.5 text-xs">
              <Row label="You pay" value={`$${parseFloat(amount).toFixed(4)}`} />
              <Row label="Commission (20%)" value={`−$${commission.toFixed(4)}`} color="text-red" />
              <div className="pt-1.5 border-t border-line">
                <Row label="Actual promote" value={`$${actual.toFixed(4)}`} color="text-green font-black" />
              </div>
            </div>
          )}

          <div className="bg-brand/10 border border-brand/30 rounded-xl p-3 flex gap-2">
            <Info size={14} className="text-brand flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-txt-soft">
              Promote Balance থেকে কাটা হবে। Main balance থাকলে আগে <b>Main → Promote</b> convert করুন।
            </p>
          </div>

          <button
            onClick={submit}
            disabled={busy || !link || !amount || parseFloat(amount) < 1}
            className="btn btn-brand w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <><Spinner size={14} /> Submitting...</> : <><Rocket size={16} /> Submit Promote</>}
          </button>

          {msg && <p className="text-center text-xs">{msg}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm pt-2">
        <ArrowLeft size={16} /> Back
      </button>
      <div>
        <h1 className="text-2xl font-black">🚀 Promote</h1>
        <p className="text-xs text-muted mt-1">আপনার channel, group, bot বা post promote করুন</p>
      </div>

      <div className="card-soft">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Promote Balance</span>
          <span className="text-lg font-black text-brand">${fmtMoney(user.promoteBalance || 0)}</span>
        </div>
        <button
          onClick={() => setPage && setPage('profile')}
          className="text-[10px] text-brand font-bold mt-2 active:opacity-70"
        >
          → Main → Promote convert করুন
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-wider font-bold px-1">Select Type</p>
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setType(t.id); setStep('form') }}
            className="card w-full flex items-center gap-3 active:scale-98 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-brand/15 flex items-center justify-center text-brand flex-shrink-0">
              {t.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold">{t.label}</p>
              <p className="text-[10px] text-muted">{t.auto ? 'Instant auto-verify' : 'Manual review'}</p>
            </div>
            {t.auto && <span className="text-[9px] bg-green/20 text-green px-2 py-0.5 rounded-full font-bold">AUTO</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, color, mono }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted">{label}</span>
      <span className={cn('font-semibold', mono && 'font-mono text-[10px]', color)}>{value}</span>
    </div>
  )
}
