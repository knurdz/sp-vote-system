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
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const

export function Navbar() {
  const { user, role, signOut } = useAuth()
  const { team } = useUserTeam(user?.email, role)
  const { pathname } = useLocation()

  const visibleNavItems = [
    ...NAV_ITEMS,
    ...(role === 'leader'
      ? [
          {
            to: '/workspace',
            label: 'Workspace',
            match: (path: string) => path.startsWith('/workspace'),
            icon: (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 22h14a2 2 0 002-2V7.5L16.5 3H5a2 2 0 00-2 2v15a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
        ]
      : []),
  ].filter(
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
    <>
      <header className="sticky top-0 z-40 w-full shrink-0 border-b border-border bg-bg-header/70 shadow-panel backdrop-blur-lg">
        <nav className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <div className="flex shrink-0 flex-col gap-0.5 pt-1">
              <Wordmark />
              <p className="hidden pl-0.5 text-[10px] font-mono leading-tight tracking-wide text-text-muted md:block">
                The briefing room for transparent project Ops.
              </p>
            </div>

            <div className="hidden h-6 w-px shrink-0 bg-border md:block" aria-hidden />

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center rounded-xl border border-border bg-bg-elevated/30 p-0.5">
              {visibleNavItems.map(({ to, label, match, icon }) => {
                const active = match(pathname)
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-display font-semibold transition-all duration-200 active:scale-[0.97] sm:px-3.5 sm:py-1.5',
                      active
                        ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(0,201,120,0.18)]'
                        : 'text-text-secondary hover:bg-bg-surface/50 hover:text-text-primary',
                    )}
                  >
                    {icon}
                    <span>{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-bg-elevated/20 p-1 md:gap-3 md:bg-bg-elevated/30 md:px-3 md:py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-display text-[11px] font-bold text-accent shadow-[0_0_10px_var(--accent-glow)] md:h-9 md:w-9">
                  {displayInitials}
                </div>

                <div className="hidden min-w-0 md:block">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-text-primary">
                      {truncate(primaryLabel, 16)}
                    </span>
                    {isAdmin && <Badge variant="admin">admin</Badge>}
                  </div>
                  {showAdminEmail && (
                    <p className="truncate font-mono text-[10px] text-text-muted">
                      {truncate(email, 30)}
                    </p>
                  )}
                </div>

                <div className="hidden h-5 w-px bg-border md:block" aria-hidden />

                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="shrink-0 cursor-pointer select-none font-display text-[13px] font-semibold text-text-secondary transition-colors hover:text-accent flex items-center gap-1 px-2 py-1.5 md:p-0"
                  aria-label="Sign out"
                >
                  <span className="hidden 2xl:inline">Sign out</span>
                  <svg
                    className="h-4 w-4 2xl:hidden"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="min-h-11 px-4">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {pathname !== '/login' && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center justify-around rounded-2xl border border-border bg-bg-header/85 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-lg">
          {visibleNavItems.map(({ to, label, match, icon }) => {
            const active = match(pathname)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 rounded-xl py-1 text-[10px] font-display font-bold transition-all duration-200 active:scale-[0.95]',
                  active
                    ? 'text-accent bg-accent/8'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <div className="p-0.5">{icon}</div>
                <span className="font-semibold text-[10px] tracking-wide">{label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
