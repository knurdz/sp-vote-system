import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUserTeam } from '@/hooks/useTeams'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Wordmark } from './Wordmark'
import { cn, getInitials, truncate } from '@/lib/utils'

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

export function Navbar() {
  const { user, role, signOut } = useAuth()
  const team = useUserTeam(user?.email, role)
  const { pathname } = useLocation()

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || role === 'admin',
  )

  const teamName = team?.name
  const email = user?.email ?? ''
  const isAdmin = role === 'admin'
  const isLeader = role === 'leader'

  const primaryLabel = isLeader
    ? teamName ?? 'Team leader'
    : isAdmin
      ? teamName ?? email
      : email

  const showAdminEmail = isAdmin && !!email && !!teamName
  const displayInitials = getInitials(teamName ?? primaryLabel)

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-bg-surface/95 backdrop-blur-md">
      <nav className="mx-auto flex h-[68px] max-w-page items-center justify-between gap-6 px-8">
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
                    'inline-flex cursor-pointer select-none items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all',
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

        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-3 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-[11px] font-semibold text-accent">
                {displayInitials}
              </div>

              <div className="hidden min-w-0 lg:block">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13px] text-text-primary">
                    {truncate(primaryLabel, 32)}
                  </span>
                  {isAdmin && <Badge variant="admin">admin</Badge>}
                </div>
                {showAdminEmail && (
                  <p className="truncate font-mono text-[11px] text-text-muted">
                    {truncate(email, 36)}
                  </p>
                )}
              </div>

              <div className="hidden h-5 w-px bg-border lg:block" aria-hidden />

              <button
                type="button"
                onClick={() => void signOut()}
                className="shrink-0 cursor-pointer select-none text-[13px] text-text-secondary transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="md">Sign in</Button>
            </Link>
          )}
        </div>
      </nav>
      <div className="navbar-gradient-line" />
    </header>
  )
}
