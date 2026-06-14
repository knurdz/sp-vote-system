import { cn } from '@/lib/utils'

export interface FilterTab {
  id: string
  label: string
  count?: number
}

interface FilterTabsProps {
  tabs: FilterTab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  scrollable?: boolean
}

export function FilterTabs({
  tabs,
  activeId,
  onChange,
  className,
  scrollable = true,
}: FilterTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full rounded-xl border border-border bg-bg-surface p-1',
        scrollable && 'scrollbar-thin overflow-x-auto',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex shrink-0 touch-target items-center gap-ds-2 rounded-lg px-ds-4 py-ds-2 text-sm font-medium transition-all duration-150',
              active
                ? 'bg-accent text-black shadow-accent-glow'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  active ? 'bg-black/20 text-black' : 'bg-accent-glow text-accent',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
