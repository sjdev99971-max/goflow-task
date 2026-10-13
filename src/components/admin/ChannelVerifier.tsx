'use client'
import { useState } from 'react'
import { Check, X, ExternalLink, Bot, AlertCircle, Shield, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Channel verification helper for admin task creation
 * Flow:
 *  1. Admin enters channel @username or -100xxx
 *  2. Click "Verify Bot Admin" → calls API
 *  3. API checks if bot is admin
 *  4. If not admin → shows instructions + Open Channel button
 *  5. If admin → shows success + returns channel data
 */
export default function ChannelVerifier({
  channel,
  setChannel,
  onVerified,
  verified,
  initData
}: {
  channel: string
  setChannel: (v: string) => void
  onVerified: (data: any) => void
  verified: boolean
  initData: string
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const verify = async () => {
    if (!channel.trim()) { setError('Channel username/ID দিন'); return }
    setBusy(true); setError(''); setResult(null)

    try {
      const res = await fetch('/api/admin/verify-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData },
        body: JSON.stringify({ channel: channel.trim() })
      })
      const d = await res.json()

      if (!d.ok) {
        setError(d.message || d.error || 'Verification failed')
        setResult({ step: 'error', ...d })
      } else if (d.isAdmin) {
        setResult({ step: 'success', ...d })
        onVerified({ channel: channel.trim(), ...d })
      } else {
        setResult({ step: 'not_admin', ...d })
      }
    } catch (e: any) {
      setError(e.message || 'Network error')
    }
    setBusy(false)
  }

  const openChannel = () => {
    const ch = channel.trim()
    const url = ch.startsWith('-')
      ? `https://t.me/c/${ch.replace('-100', '')}`
      : `https://t.me/${ch.replace('@', '')}`
    ;(window as any).Telegram?.WebApp?.openTelegramLink?.(url) || window.open(url, '_blank')
  }

  const openBotLink = () => {
    if (!result?.botUsername) return
    const url = `https://t.me/${result.botUsername}`
    ;(window as any).Telegram?.WebApp?.openTelegramLink?.(url) || window.open(url, '_blank')
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted uppercase tracking-wider font-bold">
        Channel / Group {verified && <span className="text-green">✓ Verified</span>}
      </label>

      <div className="flex gap-2">
        <input
          value={channel}
          onChange={e => { setChannel(e.target.value); setResult(null); setError('') }}
          placeholder="@channelname বা -100xxx"
          disabled={verified}
          className={cn(
            'flex-1 bg-bg-soft border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none',
            verified ? 'border-green/50 bg-green/5' : 'border-line focus:border-brand'
          )}
        />
        {verified ? (
          <button
            onClick={() => { onVerified(null); setResult(null) }}
            className="px-3 rounded-xl bg-red/15 text-red text-xs font-bold"
          >
            Change
          </button>
        ) : (
          <button
            onClick={verify}
            disabled={busy || !channel.trim()}
            className="px-4 rounded-xl bg-brand text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
            {busy ? '...' : 'Verify'}
          </button>
        )}
      </div>

      {/* Not admin → instructions */}
      {result?.step === 'not_admin' && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-gold">Bot is NOT admin</p>
              <p className="text-[10px] text-txt-soft mt-1">
                Task add করার আগে bot কে <b>{result.botUsername && `@${result.botUsername}`}</b> এই channel এর <b>Admin</b> বানাতে হবে
              </p>
            </div>
          </div>

          <div className="bg-bg-soft rounded-lg p-3 space-y-2 text-[10px] text-txt-soft">
            <p className="font-bold text-txt">📋 Steps:</p>
            <p>1️⃣ নিচের button চেপে channel খুলুন</p>
            <p>2️⃣ Channel Settings → Administrators → Add Admin</p>
            <p>3️⃣ Search করুন: <code className="bg-brand/20 px-1 rounded text-brand">{result.botUsername}</code></p>
            <p>4️⃣ Add করে সব permissions দিন (Post messages, Delete, Pin)</p>
            <p>5️⃣ ফিরে এসে আবার <b>Verify</b> চাপুন</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={openChannel}
              className="flex-1 bg-brand text-white py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <ExternalLink size={12} /> Open Channel
            </button>
            <button
              onClick={() => { setResult(null); verify() }}
              className="flex-1 bg-bg-soft border border-line py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <Shield size={12} /> Re-verify
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {result?.step === 'success' && (
        <div className="bg-green/10 border border-green/30 rounded-xl p-3 flex items-start gap-2">
          <Check size={16} className="text-green flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-green">✅ Bot is Admin</p>
            <p className="text-[10px] text-txt-soft mt-1">
              {result.chatTitle && <><b>{result.chatTitle}</b> · </>}
              {result.chatType && <span className="uppercase">{result.chatType}</span>}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && result?.step !== 'not_admin' && (
        <div className="bg-red/10 border border-red/30 rounded-xl p-3 flex items-start gap-2">
          <X size={14} className="text-red flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red flex-1">{error}</p>
        </div>
      )}

      {/* Auto-verify info for Telegram tasks */}
      {!verified && (
        <p className="text-[10px] text-muted flex items-center gap-1">
          <Bot size={10} />
          Telegram tasks এর জন্য bot admin থাকা বাধ্যতামূলক
        </p>
      )}
    </div>
  )
}
