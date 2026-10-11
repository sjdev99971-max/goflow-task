'use client'
import { cn } from '@/lib/utils'

export default function BottomNav({ tab, setTab, tabs }: any) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-lg border-t border-line max-w-lg mx-auto z-50">
      <div className="flex justify-around py-2">
        {tabs.map((it: any) => {
          const Icon = it.icon
          const active = tab === it.id
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 min-w-[60px]"
            >
              <Icon size={22} className={active ? 'text-brand' : 'text-muted'} strokeWidth={active ? 2.5 : 2} />
              <span className={cn('text-[10px] font-semibold tracking-wide', active ? 'text-brand' : 'text-muted')}>
                {it.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
