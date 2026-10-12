'use client'
import { useEffect, useState } from 'react'
import { ExternalLink, Check, Shield } from 'lucide-react'
import { Spinner } from '@/components/ui/Loading'

export default function ForceJoinGate({ initData, onPass }: { initData: string; onPass: () => void }) {
  const [channels, setChannels] = useState<string[]>([])
  const [joined, setJoined] = useState<Record<string, boolean>>({})
  const [checking, setChecking] = useState(true)
  const [verifying, setVerifying] = useState(false)

  const load = async () => {
    setChecking(true)
    try {
      const r = await fetch('/api/user/force-join', {
        headers: { 'x-init-data': initData }
      })
      const d = await r.json()
      if (d.ok) {
        if (d.allJoined) {
          onPass()
          return
        }
        setChannels(d.channels || [])
        setJoined(d.joined || {})
      }
    } catch {}
    setChecking(false)
  }

  useEffect(() => { load() }, [initData])

  const verify = async () => {
    setVerifying(true)
    const r = await fetch('/api/user/force-join', {
      method: 'POST',
      headers: { 'x-init-data': initData }
    })
    const d = await r.json()
    setVerifying(false)
    if (d.ok && d.allJoined) {
      onPass()
    } else {
      setJoined(d.joined || {})
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
        <div className="text-center">
          <Spinner size={32} />
          <p className="mt-4 text-muted text-sm">Checking membership...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-bg">
      <div className="max-w-md mx-auto space-y-5 pt-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mx-auto">
            <Shield size={32} className="text-brand" />
          </div>
          <h1 className="text-2xl font-black mt-4">Join Required</h1>
          <p className="text-xs text-muted mt-2">
            App access পেতে নিচের সব channel/group এ join করুন
          </p>
        </div>

        <div className="space-y-2">
          {channels.map((ch) => {
            const isJoined = joined[ch]
            const url = ch.startsWith('-') 
              ? `https://t.me/c/${ch.replace('-100', '')}`
              : `https://t.me/${ch.replace('@', '')}`
            return (
              <a
                key={ch}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`card flex items-center gap-3 active:scale-98 transition ${isJoined ? 'border-green/40' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isJoined ? 'bg-green/20' : 'bg-brand/15'}`}>
                  {isJoined
                    ? <Check size={18} className="text-green" />
                    : <ExternalLink size={16} className="text-brand" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{ch}</p>
                  <p className="text-[10px] text-muted">
                    {isJoined ? '✅ Joined' : 'Tap to join'}
                  </p>
                </div>
              </a>
            )
          })}
        </div>

        <button
          onClick={verify}
          disabled={verifying}
          className="btn btn-brand w-full flex items-center justify-center gap-2"
        >
          {verifying ? <><Spinner size={14} /> Verifying...</> : '✅ Verify & Continue'}
        </button>

        <p className="text-center text-[10px] text-dim">
          সব চ্যানেলে join করার পর Verify চাপুন
        </p>
      </div>
    </div>
  )
}
