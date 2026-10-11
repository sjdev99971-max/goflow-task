'use client'

import { cn } from '@/lib/utils'

/** Animated shimmer block */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn(
      'relative overflow-hidden bg-bg-soft rounded-xl',
      'before:absolute before:inset-0 before:-translate-x-full',
      'before:animate-[shimmer_1.5s_infinite]',
      'before:bg-gradient-to-r before:from-transparent before:via-brand/10 before:to-transparent',
      className
    )} />
  )
}

/** Rotating brand spinner */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('border-2 border-brand border-t-transparent rounded-full animate-spin', className)}
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
    />
  )
}

/** Full-page splash */
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-line" />
        <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full bg-brand/20 animate-pulse" />
      </div>
      <p className="text-muted text-xs tracking-widest uppercase font-bold">{label}</p>
    </div>
  )
}

/** Card skeleton */
export function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('card space-y-3', className)}>
      <Shimmer className="h-4 w-1/2" />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <Shimmer key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

/** Task card skeleton */
export function TaskSkeleton() {
  return (
    <div className="card flex items-center gap-3 animate-pulse">
      <Shimmer className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-2 w-1/2" />
      </div>
      <Shimmer className="w-16 h-8 rounded-xl" />
    </div>
  )
}

/** Stats cards skeleton */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="card-soft py-3 px-2 flex flex-col items-center gap-2">
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-2 w-10" />
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
        <div key={i} className="card flex items-center gap-3 py-3 animate-pulse">
          <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3 w-2/3" />
            <Shimmer className="h-2 w-1/3" />
          </div>
          <Shimmer className="h-4 w-12" />
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
        <div key={i} className="card flex items-center gap-3 py-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-bg-soft" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3 w-1/2" />
            <Shimmer className="h-2 w-1/4" />
          </div>
          <Shimmer className="h-4 w-14" />
        </div>
      ))}
    </div>
  )
}

/** Inline loading pill */
export function LoadingPill({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-muted text-xs">
      <Spinner size={14} />
      <span>{label}</span>
    </div>
  )
}

/** Button loading state */
export function ButtonLoader() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span>Please wait...</span>
    </span>
  )
}
