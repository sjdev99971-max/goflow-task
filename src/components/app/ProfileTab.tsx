'use client'
import { useState } from 'react'
import { ChevronRight, Wallet, Settings, Gift, Shield, ArrowLeft, Users } from 'lucide-react'
import { fmtMoney, initials, cn } from '@/lib/utils'
import TypingText from '@/components/ui/TypingText'

export default function ProfileTab({ user, initData, setPage }: any) {
  const [mode, setMode] = useState<'main' | 'withdraw' | 'convert'>('main')
  const [method, setMethod] = useState('binance')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const level = Math.floor((user.totalEarned || 0) / 50) + 1
  const progress = ((user.totalEarned || 0) % 50) / 50 * 100

  const submitWithdraw = async () => {
    setBusy(true); setMsg('')
    const res = await fetch('/api/user/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ amount: parseFloat(amount), method, address })
    })
    const d = await res.json()
    setBusy(false)
    if (d.ok) { setMsg('✅ Submitted!'); setAmount(''); setAddress('') }
    else setMsg('❌ ' + (d.error || 'Failed'))
  }

  const convert = async () => {
    setBusy(true); setMsg('')
    const res = await fetch('/api/user/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
      body: JSON.stringify({ amount: parseFloat(amount) })
    })
    const d = await res.json()
    setBusy(false)
    if (d.ok) { setMsg('✅ Converted!'); setAmount('') }
    else setMsg('❌ ' + (d.error || 'Failed'))
  }

  if (mode === 'withdraw') {
    return (
      <div className="p-4 space-y-3">
        <button onClick={() => setMode('main')} className="flex items-center gap-1 text-muted text-sm pt-2">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-black">Withdraw</h1>
        <div className="card space-y-3">
          <div>
            <label className="text-xs text-muted">Method</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[['binance', 'Binance'], ['bep20', 'BEP20'], ['tonkeeper', 'Tonkeeper']].map(([k, l]) => (
                <button key={k} onClick={() => setMethod(k)} className={cn('btn text-xs', method === k ? 'btn-brand' : 'btn-ghost')}>{l}</button>
              ))}
            </div>
          </div>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount (min $0.20)" className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address / UID" className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
          <button onClick={submitWithdraw} disabled={busy || !amount || !address} className="btn btn-brand w-full">
            {busy ? 'Processing...' : 'Submit'}
          </button>
          {msg && <p className="text-xs text-center">{msg}</p>}
        </div>
      </div>
    )
  }

  if (mode === 'convert') {
    return (
      <div className="p-4 space-y-3">
        <button onClick={() => setMode('main')} className="flex items-center gap-1 text-muted text-sm pt-2">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-black">Main → Promote</h1>
        <div className="card space-y-3">
          <p className="text-xs text-muted">Main Balance থেকে Promote এ নিন। Reverse সম্ভব না।</p>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount" className="w-full bg-bg-soft border border-line rounded-xl px-3 py-2.5 text-sm" />
          <button onClick={convert} disabled={busy || !amount} className="btn btn-brand w-full">
            {busy ? 'Converting...' : 'Convert'}
          </button>
          {msg && <p className="text-xs text-center">{msg}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-black pt-2">Profile</h1>

      {/* Profile Card */}
      <div className="card relative overflow-hidden">
        <div className="flex items-center gap-3">
          {user.photoUrl
            ? <img src={user.photoUrl} className="w-14 h-14 rounded-2xl border-2 border-brand" alt="" />
            : <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-xl font-black">
                {initials(user.firstName, user.lastName)}
              </div>
          }
          <div className="flex-1">
            <p className="font-black text-lg">🍁 {user.firstName} {user.lastName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-brand/20 text-brand px-2 py-0.5 rounded-full font-bold">Lv.{level}</span>
              <span className="text-[10px] text-gold font-bold">{level < 5 ? 'Newbie' : level < 15 ? 'Rookie' : 'Pro'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-line overflow-hidden">
            <div className="h-full gradient-brand rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-muted mt-1 text-right">{Math.floor(progress)}/100</p>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="card-soft">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-brand" />
          <p className="text-sm font-bold">My Wallet</p>
        </div>
        <p className="text-4xl font-black text-brand">
          <span className="text-2xl align-top">$</span>{fmtMoney(user.mainBalance).split('.')[0]}
          <span className="text-lg text-muted">.{fmtMoney(user.mainBalance).split('.')[1]}</span>
          <span className="text-xs ml-2 text-muted">USDT</span>
        </p>
        <button onClick={() => setMode('withdraw')} className="btn btn-brand w-full mt-4 text-sm">
          ⬆️ WITHDRAW
        </button>
      </div>

      {/* Menu */}
      <div className="card-soft divide-y divide-line">
        <MenuItem icon={<Gift size={16} className="text-brand" />} label="Rewards" onClick={() => setPage('rewards')} />
        <MenuItem icon={<Users size={16} className="text-brand" />} label="Account Management" onClick={() => setPage('accounts')} />
        <MenuItem icon={<Wallet size={16} className="text-brand" />} label="Main → Promote" onClick={() => setMode('convert')} />
        <MenuItem icon={<Shield size={16} className="text-green" />} label="Skills Verification" onClick={() => setPage('skills')} />
        <MenuItem icon={<Settings size={16} className="text-brand" />} label="Settings" onClick={() => setPage('settings')} />
        {user.isAdmin && (
          <MenuItem icon={<Shield size={16} className="text-gold" />} label="Admin Panel" href="/admin" highlight />
        )}
      </div>

      <a
        href="https://t.me/shanto13163"
        target="_blank"
        rel="noreferrer"
        className="card-soft flex items-center gap-2 justify-center text-sm font-semibold text-brand"
      >
        🖇️ 24/7 Support
      </a>

      {/* Footer */}
      <div className="text-center pt-4 pb-6 space-y-2 animate-fade-in">
        <div className="inline-block px-4 py-2 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20">
          <p className="text-[10px] text-muted tracking-[0.2em] uppercase font-bold">Developed by</p>
          <p className="text-sm mt-1">
            <TypingText
              text="Mohammad JAHID"
              speed={130}
              startDelay={400}
              className="text-base"
              loop
            />
          </p>
          <a
            href="https://t.me/DEVELOPER_JAHID_BHAI"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-black mt-1 active:scale-95 transition"
            style={{
              color: '#ff8c42',
              textShadow: '0 0 10px rgba(255,107,26,0.5)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-[0_0_8px_#ff6b1a]" />
            @DEVELOPER_JAHID_BHAI
          </a>
        </div>
        <p className="text-[9px] text-dim tracking-widest uppercase">GoFlow · v1.0.0</p>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, badge, onClick, href, highlight }: any) {
  const Comp: any = href ? 'a' : 'button'
  return (
    <Comp href={href} onClick={onClick} className="w-full flex items-center gap-3 py-3 px-1 active:opacity-70">
      <div className="w-8 h-8 rounded-lg bg-bg-card flex items-center justify-center">{icon}</div>
      <span className={cn('flex-1 text-left text-sm font-semibold', highlight && 'text-gold')}>{label}</span>
      {badge && <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded-full font-bold">{badge}</span>}
      <ChevronRight size={16} className="text-muted" />
    </Comp>
  )
}
