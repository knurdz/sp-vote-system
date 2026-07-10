import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUserTeam } from '@/hooks/useTeams'
import { Footer } from './Footer'
import { PageShell } from './PageShell'
import { Wordmark } from './Wordmark'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/Button'
import { cn, truncate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  /** Optional content rendered on the right side of the breadcrumb row */
  headerRight?: React.ReactNode
}

export function PageWrapper({ children, className, headerRight }: PageWrapperProps) {
  const { user, role, signOut } = useAuth()
  const { team } = useUserTeam(user?.email, role)
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const [votedProject, setVotedProject] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    if (role !== 'leader' || !team?.id) {
      setVotedProject(null)
      return
    }

    const fetchVotedProject = async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('project_id, projects(title)')
        .eq('team_id', team.id)
        .maybeSingle()

      if (!error && data) {
        const projRaw = data.projects as { title: string } | { title: string }[] | null
        const proj = Array.isArray(projRaw) ? projRaw[0] : projRaw
        if (proj?.title) {
          setVotedProject({
            id: data.project_id,
            title: proj.title,
          })
        }
      } else {
        setVotedProject(null)
      }
    }

    void fetchVotedProject()

    const interval = setInterval(() => {
      void fetchVotedProject()
    }, 15000)

    return () => clearInterval(interval)
  }, [role, team?.id])

  const profileDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  const isAdmin = role === 'admin'
  const isLeader = role === 'leader'

  const displayInitials = team?.name
    ? team.name.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U'

  const googleAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  // Back Navigation Helper
  const getBackRoute = () => {
    if (pathname.startsWith('/project/')) return { label: 'Back to Projects', to: '/' }
    if (pathname.startsWith('/admin/spin/')) return { label: 'Back to Projects', to: '/admin/projects' }
    if (pathname !== '/') return { label: 'Back to Projects', to: '/' }
    return null
  }

  const backRoute = getBackRoute()

  // Navigation Items
  const navItems = [
    {
      to: '/',
      label: 'Projects',
      match: (path: string) => path === '/',
      icon: (className: string) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    ...(isLeader
      ? [
          {
            to: '/workspace',
            label: 'My Project',
            match: (path: string) => path.startsWith('/workspace'),
            icon: (className: string) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          },
        ]
      : []),
    ...(votedProject
      ? [
          {
            to: `/project/${votedProject.id}`,
            label: `My Vote: ${truncate(votedProject.title, 15)}`,
            match: (path: string) => path === `/project/${votedProject.id}`,
            icon: (className: string) => (
              <svg className={cn(className, "text-blue-500")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
        ]
      : []),
    {
      to: '/results',
      label: 'Results',
      match: (path: string) => path.startsWith('/results'),
      icon: (className: string) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    ...(isAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin Panel',
            match: (path: string) => path === '/admin',
            icon: (className: string) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )
          },
          {
            to: '/admin/projects',
            label: 'Manage Projects',
            match: (path: string) => path === '/admin/projects',
            icon: (className: string) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            )
          },
          {
            to: '/admin/teams',
            label: 'Manage Teams',
            match: (path: string) => path === '/admin/teams',
            icon: (className: string) => (
              <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )
          },
        ]
      : []),
    {
      to: 'https://github.com/knurdz/sp-vote-system',
      label: 'Help & Docs',
      external: true,
      match: () => false,
      icon: (className: string) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
  ]

  const isAdminPanel = isAdmin

  if (isAdminPanel) {
    return (
      <PageShell>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-border/40 bg-white dark:bg-[#14120B]/95 p-6 justify-between shadow-[0_0_20px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Wordmark />
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-display font-extrabold tracking-wider bg-accent/10 border border-accent/25 text-accent shadow-[0_0_8px_var(--accent-glow)] uppercase">
                  ADMIN
                </span>
              </div>
              
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const active = item.match(pathname)
                  const isExternal = item.external
                  const linkProps = isExternal
                    ? { href: item.to, target: '_blank', rel: 'noopener noreferrer' }
                    : { to: item.to }
                  const LinkComp = isExternal ? 'a' : Link

                  return (
                    <LinkComp
                      key={item.to}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      {...(linkProps as any)}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-display font-bold transition-all duration-200 active:scale-[0.98]",
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-base/50"
                      )}
                    >
                      {item.icon && item.icon(cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-text-muted"))}
                      <span className="inline-flex items-center gap-1">
                        <span>{item.label}</span>
                        {isExternal && (
                          <svg className="h-3 w-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        )}
                      </span>
                    </LinkComp>
                  )
                })}
              </nav>
            </div>
            
            <div className="flex flex-col gap-4 border-t border-border/20 pt-4">
              {user && (
                <div className="flex items-center gap-3 px-1">
                  <div className="h-9 w-9 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center font-display text-xs font-bold text-accent shadow-[0_0_8px_var(--accent-glow)] shrink-0 overflow-hidden">
                    {googleAvatarUrl ? (
                      <img
                        src={googleAvatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      displayInitials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-primary truncate">Admin Account</p>
                    <p className="text-[10px] font-mono text-text-muted truncate">{user.email}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between px-1">
                <ThemeToggle />
                {user && (
                  <button
                    onClick={() => void signOut()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold text-text-secondary hover:text-red transition-colors cursor-pointer"
                  >
                    <span>Logout</span>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </aside>

          <div className="flex flex-1 flex-col lg:pl-64 min-h-screen">
            <header className="header-shine lg:hidden sticky top-0 z-30 w-full border-b border-border/40 bg-bg-surface/20 backdrop-blur-md">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center gap-2 shrink-0">
                    <Wordmark />
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-display font-extrabold tracking-wider bg-accent/10 border border-accent/25 text-accent shadow-[0_0_8px_var(--accent-glow)] uppercase">
                      ADMIN
                    </span>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-xl text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors cursor-pointer"
                    aria-label="Toggle Mobile Menu"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="border-t border-border/40 bg-white dark:bg-[#14120B] overflow-hidden"
                  >
                    <div className="px-4 py-4 space-y-4">
                      <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                          const active = item.match(pathname)
                          if (item.external) {
                            return (
                              <a
                                key={item.to}
                                href={item.to}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-display text-sm font-semibold text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors"
                              >
                                <span>{item.label}</span>
                                <svg className="h-3 w-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                              </a>
                            )
                          }
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-200",
                                active
                                  ? "bg-accent/10 text-accent border-l-4 border-accent"
                                  : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
                              )}
                            >
                              {item.label}
                            </Link>
                          )
                        })}
                      </nav>

                      <div className="pt-4 border-t border-border/20 flex flex-col gap-3">
                        {user && (
                          <>
                            <div className="flex items-center gap-3 px-4">
                              <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center font-display text-xs font-bold text-accent shrink-0 overflow-hidden">
                                {googleAvatarUrl ? (
                                  <img
                                    src={googleAvatarUrl}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  displayInitials
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-text-primary truncate">Admin Account</p>
                                <p className="text-[10px] font-mono text-text-muted truncate">{user.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                void signOut()
                                setMobileMenuOpen(false)
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-display text-sm font-bold text-text-secondary hover:bg-bg-base hover:text-red transition-colors cursor-pointer"
                            >
                              <span>Logout</span>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            <motion.main
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 relative z-10',
                className,
              )}
            >
              {backRoute ? (
                <div className="mb-6 flex items-center justify-between gap-3">
                  <Link
                    to={backRoute.to}
                    className="inline-flex items-center gap-2 text-xs font-display font-bold text-text-secondary hover:text-accent transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>{backRoute.label}</span>
                  </Link>
                  {headerRight && <div className="flex items-center gap-3 shrink-0">{headerRight}</div>}
                </div>
              ) : (
                headerRight && <div className="mb-6 flex items-center justify-end gap-3">{headerRight}</div>
              )}

              {children}
            </motion.main>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {/* Top Navigation Header */}
      <header className="header-shine sticky top-0 z-30 w-full border-b border-border/40 bg-bg-surface/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Left Side: Brand Logo & Desktop Nav Links */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 shrink-0">
                <Wordmark />
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-display font-extrabold tracking-wider bg-accent/10 border border-accent/25 text-accent shadow-[0_0_8px_var(--accent-glow)] uppercase">
                    ADMIN
                  </span>
                )}
              </div>

              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const active = item.match(pathname)
                  if (item.external) {
                    return (
                      <a
                        key={item.to}
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-display font-bold text-text-secondary hover:text-text-primary hover:bg-bg-base/50 transition-colors inline-flex items-center gap-1"
                      >
                        <span>{item.label}</span>
                        <svg className="h-3 w-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )
                  }
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all duration-200 active:scale-[0.98]",
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-base/50"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Right Side: Quick Actions, Theme Switcher, Profile & Mobile Hamburger */}
            <div className="flex items-center gap-3">
              
              {/* Quick Actions for Admins (Desktop only) */}
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/admin/teams"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white dark:bg-[#14120B] px-3.5 py-1.5 text-xs font-display font-bold text-text-primary hover:bg-bg-base transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Team</span>
                  </Link>
                  <Link
                    to="/admin/projects"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-text-primary px-3.5 py-1.5 text-xs font-display font-bold text-bg-base hover:opacity-90 transition-opacity"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Project</span>
                  </Link>
                </div>
              )}

              {/* Theme Switcher Button */}
              <ThemeToggle />

              {/* User profile avatar & dropdown (Desktop only) */}
              {user ? (
                <div ref={profileDropdownRef} className="relative hidden md:block">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex h-9 w-9 rounded-full bg-accent/15 border border-accent/25 items-center justify-center font-display text-xs font-bold text-accent shadow-[0_0_8px_var(--accent-glow)] shrink-0 overflow-hidden outline-none cursor-pointer hover:border-accent/50 transition-colors"
                  >
                    {googleAvatarUrl ? (
                      <img
                        src={googleAvatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      displayInitials
                    )}
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-border/40 bg-white dark:bg-[#14120B] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex flex-col gap-3 min-w-0"
                        >
                          <div className="flex flex-col gap-1 min-w-0 pb-2 border-b border-border/20">
                            {isAdmin ? (
                              <span className="text-[10px] font-bold text-accent tracking-wider uppercase">
                                Admin
                              </span>
                            ) : team?.name ? (
                              <span className="text-[10px] font-bold text-text-secondary truncate max-w-full" title={`Team: ${team.name}`}>
                                Team: {team.name}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-text-muted uppercase">
                                Voter
                              </span>
                            )}
                            <p className="text-[10px] font-mono text-text-muted truncate max-w-full">
                              {user.email}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false)
                              void signOut()
                            }}
                            className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-display font-bold text-text-secondary hover:text-red hover:bg-red/5 transition-all cursor-pointer"
                          >
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                              <polyline points="16 17 21 12 16 7" />
                              <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:inline-flex"
                >
                  <Button variant="secondary" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Hamburger Button for Mobile Nav Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Toggle Mobile Menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

            </div>
          </div>
        </div>

        {/* Collapsible Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="lg:hidden border-t border-border/40 bg-white dark:bg-[#14120B] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-4">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const active = item.match(pathname)
                    if (item.external) {
                      return (
                        <a
                          key={item.to}
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-display text-sm font-semibold text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors"
                        >
                          <span>{item.label}</span>
                          <svg className="h-3 w-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      )
                    }
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-200",
                          active
                            ? "bg-accent/10 text-accent border-l-4 border-accent"
                            : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
                        )}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                {/* User Info & Actions for Mobile Drawer */}
                <div className="pt-4 border-t border-border/20 flex flex-col gap-3">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-4">
                        <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center font-display text-xs font-bold text-accent shrink-0 overflow-hidden">
                          {googleAvatarUrl ? (
                            <img
                              src={googleAvatarUrl}
                              alt="Profile"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            displayInitials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {team?.name || 'Leader Account'}
                          </p>
                          <p className="text-[10px] font-mono text-text-muted truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          void signOut()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-display text-sm font-bold text-text-secondary hover:bg-bg-base hover:text-red transition-colors cursor-pointer"
                      >
                        <span>Logout</span>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full block"
                    >
                      <Button variant="secondary" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Page Layout Container */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 relative z-10',
          className,
        )}
      >
        {/* Breadcrumbs / Back Route */}
        {backRoute ? (
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              to={backRoute.to}
              className="inline-flex items-center gap-2 text-xs font-display font-bold text-text-secondary hover:text-accent transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{backRoute.label}</span>
            </Link>
            {headerRight && <div className="flex items-center gap-3 shrink-0">{headerRight}</div>}
          </div>
        ) : (
          headerRight && <div className="mb-6 flex items-center justify-end gap-3">{headerRight}</div>
        )}

        {children}
      </motion.main>
      
      {/* Page Footer */}
      <Footer />
    </PageShell>
  )
}
