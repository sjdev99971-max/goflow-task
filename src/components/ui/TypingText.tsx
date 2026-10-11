'use client'
import { useEffect, useState } from 'react'

export default function TypingText({
  text,
  speed = 90,
  startDelay = 200,
  className = '',
  cursor = true,
  loop = false,
  pauseAfter = 2000
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

  // Typing
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

  // Loop (optional)
  useEffect(() => {
    if (!loop || !done) return
    const t = setTimeout(() => {
      setDisplayed('')
      setIdx(0)
      setDone(false)
    }, pauseAfter)
    return () => clearTimeout(t)
  }, [done, loop, pauseAfter])

  return (
    <span className={className}>
      {displayed}
      {cursor && !done && <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-pulse" />}
    </span>
  )
}
