import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Wordmark } from './Wordmark'
import { cn, getInitials, truncate } from '@/lib/utils'

const GITHUB_URL = 'https://github.com/knurdz/sp-vote-system'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Projects',
    match: (path: string) => path === '/',
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
    to: '/results',
    label: 'Results',
    match: (path: string) => path.startsWith('/results'),
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/admin',
    label: 'Admin',
    match: (path: string) => path.startsWith('/admin'),
    adminOnly: true,
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('h-3.5 w-3.5', className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

export function Navbar() {
  const { user, role, signOut } = useAuth()
  const { pathname } = useLocation()

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || role === 'admin',
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-surface/95 backdrop-blur-md">
      <nav className="mx-auto flex h-[68px] max-w-page items-center justify-between gap-6 px-8">
        {/* Left — brand + navigation */}
        <div className="flex min-w-0 items-center gap-5">
          <div className="shrink-0">
            <Wordmark />
            <p className="mt-0.5 pl-3.5 text-[11px] tracking-wide text-text-muted">
              Transparent project allocation
            </p>
          </div>

          <div className="hidden h-8 w-px shrink-0 bg-border sm:block" aria-hidden />

          <div className="flex items-center rounded-xl border border-border bg-bg-elevated p-1">
            {visibleNavItems.map(({ to, label, match, icon }) => {
              const active = match(pathname)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all',
                    active
                      ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
                      : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
                  )}
                >
                  {icon}
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right — meta + account */}
        <div className="flex shrink-0 items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3.5 py-2 text-[12px] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent md:inline-flex"
          >
            <GitHubIcon />
            <span>Open Source</span>
          </a>

          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-3 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-[11px] font-semibold text-accent">
                {getInitials(user.email ?? '?')}
              </div>

              <div className="hidden min-w-0 items-center gap-2 lg:flex">
                <span className="truncate text-[13px] text-text-primary">
                  {truncate(user.email ?? '', 32)}
                </span>
                {role && <Badge variant={role}>{role}</Badge>}
              </div>

              <div className="hidden h-5 w-px bg-border lg:block" aria-hidden />

              <button
                type="button"
                onClick={() => void signOut()}
                className="shrink-0 text-[13px] text-text-secondary transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </nav>
      <div className="navbar-gradient-line" />
    </header>
  )
}
