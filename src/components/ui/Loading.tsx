'use client'

import { cn } from '@/lib/utils'

/** Animated shimmer block — high visibility for low brightness */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-xl bg-[#2a2a2a]', className)}
      style={{ background: 'linear-gradient(90deg, #1f1f1f 0%, #2a2a2a 50%, #1f1f1f 100%)' }}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,107,26,0.6) 50%, transparent 100%)'
        }}
      />
    </div>
  )
}

/** Rotating brand spinner — glowing */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('rounded-full animate-spin', className)}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, size / 10),
        borderStyle: 'solid',
        borderColor: '#ff6b1a',
        borderTopColor: 'transparent',
        boxShadow: '0 0 12px rgba(255,107,26,0.8)'
      }}
    />
  )
}

/** Full-page splash — bright animated ring */
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a]" />
        <div
          className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#ff6b1a', borderTopColor: 'transparent', boxShadow: '0 0 24px rgba(255,107,26,0.6)' }}
        />
        <div
          className="absolute inset-3 rounded-full animate-pulse"
          style={{ background: 'radial-gradient(circle, #ff8c42 0%, transparent 70%)' }}
        />
      </div>
      <p className="text-brand text-xs tracking-[0.3em] uppercase font-black" style={{ textShadow: '0 0 12px rgba(255,107,26,0.7)' }}>
        {label}
      </p>
    </div>
  )
}

/** Card skeleton */
export function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('card space-y-3', className)}>
      <Shimmer className="h-5 w-1/2" />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <Shimmer key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

/** Task card skeleton — matches real task card */
export function TaskSkeleton() {
  return (
    <div className="card flex items-center gap-3">
      <Shimmer className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="w-16 h-9 rounded-xl flex-shrink-0" />
    </div>
  )
}

/** Stats cards skeleton */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="card-soft py-3 px-2 flex flex-col items-center gap-2">
          <Shimmer className="h-6 w-16" />
          <Shimmer className="h-3 w-10" />
        </div>
      ))}
    </div>
  )
}

/** List item skeleton */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 py-3">
          <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="h-3 w-1/3" />
          </div>
          <Shimmer className="h-5 w-14 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Leaderboard rank skeleton */
export function RankSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="card flex items-center gap-3 py-3">
          <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-1/2" />
            <Shimmer className="h-3 w-1/4" />
          </div>
          <Shimmer className="h-5 w-16 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Inline loading pill */
export function LoadingPill({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Spinner size={16} />
      <span className="text-brand text-xs font-bold tracking-wider uppercase" style={{ textShadow: '0 0 8px rgba(255,107,26,0.5)' }}>
        {label}
      </span>
    </div>
  )
}

/** Button loading state */
export function ButtonLoader() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-3.5 h-3.5 rounded-full animate-spin"
        style={{ borderWidth: 2, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
      />
      <span>Please wait...</span>
    </span>
  )
}

/** Skeleton for 2 stat cards */
export function StatsPairSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2].map(i => (
        <div key={i} className="card-soft space-y-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}
