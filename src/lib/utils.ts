import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtMoney(n: number | string): string {
  const v = typeof n === 'string' ? parseFloat(n) : n
  return (v || 0).toFixed(4)
}

export function initials(first?: string | null, last?: string | null) {
  return ((first?.[0] || '') + (last?.[0] || '') || 'U').toUpperCase()
}
