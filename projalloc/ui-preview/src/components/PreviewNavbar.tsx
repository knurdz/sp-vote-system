import { Badge } from '@/components/ui/Badge'
import { Wordmark } from '@/components/layout/Wordmark'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Projects',
    active: true,
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Results',
    active: false,
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Admin',
    active: false,
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const

export function PreviewNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-cyan)] bg-[var(--panel-bg)] backdrop-blur-md">
      <nav className="mx-auto flex h-[68px] max-w-page items-center justify-between gap-6 px-8">
        <div className="flex min-w-0 items-center gap-5">
          <div className="shrink-0">
            <Wordmark asLink={false} />
            <p className="mt-0.5 pl-3.5 text-[11px] tracking-wide text-text-muted">
              Transparent project allocation
            </p>
          </div>

          <div className="hidden h-8 w-px shrink-0 bg-border sm:block" aria-hidden />

          <div className="flex items-center rounded-xl border border-[var(--border-cyan)] bg-ocean/40 p-1">
            {NAV_ITEMS.map(({ label, active, icon }) => (
              <span
                key={label}
                className={cn(
                  'inline-flex cursor-default select-none items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all',
                  active
                    ? 'bg-cyan/10 text-ice shadow-[inset_0_0_0_1px_rgba(167,235,242,0.35),0_0_12px_rgba(84,172,191,0.15)]'
                    : 'text-text-secondary',
                )}
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-cyan)] bg-ocean/40 px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan/40 bg-cyan/15 text-[11px] font-semibold text-ice shadow-glow-cyan">
              TA
            </div>
            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <span className="truncate text-[13px] text-text-primary">Team Alpha</span>
              <Badge variant="leader">leader</Badge>
            </div>
            <div className="hidden h-5 w-px bg-border lg:block" aria-hidden />
            <button
              type="button"
              className="shrink-0 cursor-default select-none text-[13px] text-text-secondary"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <div className="navbar-gradient-line" />

      <div className="border-b border-cyan/20 bg-midnight/80 px-4 py-1.5 text-center">
        <p className="font-mono text-[11px] tracking-wide text-cyan/80">
          UI PREVIEW MODE — mock data only, no backend required
        </p>
      </div>
    </header>
  )
}
