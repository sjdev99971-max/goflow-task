'use client'
import { useEffect, useState } from 'react'

export default function TypingText({
  text,
  speed = 110,
  startDelay = 300,
  className = '',
  cursor = true,
  loop = true,
  pauseAfter = 2500
}: {
  text: string
  speed?: number
  startDelay?: number
  className?: string
  cursor?: boolean
  loop?: boolean
  pauseAfter?: number
}) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (done) return
    const start = setTimeout(() => {
      if (idx < text.length) {
        setDisplayed(text.slice(0, idx + 1))
        setIdx(i => i + 1)
      } else {
        setDone(true)
      }
    }, idx === 0 ? startDelay : speed)
    return () => clearTimeout(start)
  }, [idx, text, speed, startDelay, done])

  useEffect(() => {
    if (!loop || !done) return
    const fade = setTimeout(() => setVisible(false), pauseAfter - 400)
    const t = setTimeout(() => {
      setDisplayed('')
      setIdx(0)
      setDone(false)
      setVisible(true)
    }, pauseAfter)
    return () => { clearTimeout(fade); clearTimeout(t) }
  }, [done, loop, pauseAfter])

  return (
    <span
      className={className}
      style={{
        color: '#ffb347',
        textShadow: '0 0 12px rgba(255,107,26,0.85), 0 0 24px rgba(255,107,26,0.4)',
        fontWeight: 800,
        letterSpacing: '0.5px',
        transition: 'opacity 0.4s ease',
        opacity: visible ? 1 : 0
      }}
    >
      {displayed}
      {cursor && !done && (
        <span
          className="inline-block align-middle ml-0.5 rounded-sm"
          style={{
            width: '2.5px',
            height: '1em',
            background: '#ff8c42',
            boxShadow: '0 0 8px #ff6b1a',
            animation: 'pulse 0.8s ease-in-out infinite'
          }}
        />
      )}
    </span>
  )
}
