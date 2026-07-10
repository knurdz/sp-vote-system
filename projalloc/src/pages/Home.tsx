import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectList } from '@/components/projects/ProjectList'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { useUserTeam } from '@/hooks/useTeams'
import { supabase } from '@/lib/supabase'
import type { ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open now', value: 'voting' },
  { label: 'Coming soon', value: 'upcoming' },
  { label: 'Closed', value: 'closed' },
  { label: 'Assigned', value: 'assigned' },
]

const EMPTY_COPY: Record<
  ProjectStatus | 'all',
  { message: string; description: string }
> = {
  all: {
    message: 'No projects here yet',
    description:
      'When coordinators add projects, they’ll show up here. Team leaders can vote once something opens.',
  },
  voting: {
    message: 'Nothing open right now',
    description:
      'No projects are taking votes at the moment. Check back soon — new ones appear here when they’re ready.',
  },
  upcoming: {
    message: 'Nothing scheduled yet',
    description: 'Projects waiting to open will show up here first.',
  },
  closed: {
    message: 'No closed projects',
    description: 'Finished voting rounds sit here until the spin happens.',
  },
  assigned: {
    message: 'No assigned projects yet',
    description: 'Once a spin is locked, the matched team shows up here.',
  },
}

export function Home() {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const { projects: allProjects, assignedTeams, voteCounts, loading, error } = useProjects('all')
  const { role, user } = useAuth()
  const { team } = useUserTeam(user?.email, role)

  // Fetch which project this team has voted for (leader only)
  const [votedProjectId, setVotedProjectId] = useState<string | null>(null)
  useEffect(() => {
    if (role !== 'leader' || !team?.id) {
      setVotedProjectId(null)
      return
    }
    supabase
      .from('votes')
      .select('project_id')
      .eq('team_id', team.id)
      .maybeSingle()
      .then(({ data }) => {
        setVotedProjectId(data?.project_id ?? null)
      })
  }, [role, team?.id])

  const projects = useMemo(
    () => {
      let filtered = filter === 'all'
        ? allProjects
        : allProjects.filter((p) => p.status === filter)

      if (search.trim()) {
        const query = search.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.company.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.tech_stack.some((tech) => tech.toLowerCase().includes(query))
        )
      }
      return filtered
    },
    [allProjects, filter, search],
  )

  const counts = useMemo(
    () => ({
      all: allProjects.length,
      voting: allProjects.filter((p) => p.status === 'voting').length,
      upcoming: allProjects.filter((p) => p.status === 'upcoming').length,
      closed: allProjects.filter((p) => p.status === 'closed').length,
      assigned: allProjects.filter((p) => p.status === 'assigned').length,
    }),
    [allProjects],
  )

  return (
    <PageWrapper>
      <div className="relative z-10 space-y-6">
        
        {/* Banner Announcement (If leader is missing CV submission) */}
        {role === 'leader' && team && !team.cv_url && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-display text-sm font-bold text-text-primary">CV Upload Required</h3>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Your team <span className="font-bold text-text-primary">{team.name}</span> must upload a single ZIP containing CVs of all members in the workspace to participate in project voting.
                </p>
              </div>
            </div>
            
            <Link
              to="/workspace"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500 bg-amber-500/8 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-black px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-200"
            >
              <span>Upload CV Archive</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Title Block */}
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-text-primary sm:text-3xl uppercase">
            Mission Log
          </h1>
          <p className="text-sm text-text-secondary sm:text-base">
            Browse and vote on industry projects allocated to BATCH 24 teams.
          </p>
        </div>

        {/* Filters and Controls Row (Reference image matching layout) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/40">
          
          {/* Left Side: Count Info */}
          <div className="text-xs font-semibold text-text-secondary">
            Showing <span className="font-bold text-text-primary">{projects.length}</span> of {allProjects.length} projects
          </div>

          {/* Right Side: Search, Switch and Filters Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:justify-end">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#14120B] border border-border/80 rounded-xl py-2 pl-9 pr-8 text-xs focus:outline-none focus:border-accent text-text-primary"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted hover:text-text-primary cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Segmented Layout Toggle: Grid/List */}
            <div className="flex items-center rounded-xl border border-border bg-white dark:bg-[#14120B] p-0.5 h-9 shrink-0">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  layout === 'grid'
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary"
                )}
                title="Grid View"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setLayout('list')}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  layout === 'list'
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary"
                )}
                title="List View"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>

            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-display font-bold text-text-primary transition-all cursor-pointer sm:w-auto",
                  dropdownOpen
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-white dark:bg-[#14120B] hover:bg-bg-base"
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>{filter === 'all' ? 'Filters' : `Status: ${FILTERS.find(f => f.value === filter)?.label}`}</span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-border bg-white p-1.5 shadow-lg dark:bg-[#14120B]"
                    >
                      <div className="border-b border-border/40 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Filter by status
                      </div>
                      <div className="space-y-0.5 py-1">
                        {FILTERS.map((f) => {
                          const count = counts[f.value]
                          const active = filter === f.value
                          return (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() => {
                                setFilter(f.value)
                                setDropdownOpen(false)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-display font-semibold transition-colors cursor-pointer",
                                active
                                  ? "bg-accent/10 text-accent"
                                  : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
                              )}
                            >
                              <span>{f.label}</span>
                              <span
                                className={cn(
                                  "inline-flex h-4 min-w-4 items-center justify-center rounded-full border px-1 font-mono text-[9px] font-bold transition-colors",
                                  active
                                    ? "border-accent/20 bg-accent/10 text-accent"
                                    : "border-border bg-bg-base text-text-muted"
                                )}
                              >
                                {count}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden gap-1 overflow-x-auto rounded-full border border-border/70 bg-white/70 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-[#14120B]/45 md:flex">
              {FILTERS.map((f) => {
                const count = counts[f.value]
                const active = filter === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-display font-bold transition-colors cursor-pointer",
                      active
                        ? "bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] dark:bg-[#eefbf2] dark:text-[#111812]"
                        : "text-slate-600 hover:text-slate-900 dark:text-[#d8eee0] dark:hover:text-white",
                    )}
                  >
                    <span>{f.label}</span>
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 font-mono text-[10px] font-bold",
                        active
                          ? "border-white/30 bg-white/10 text-white dark:border-[#111812]/20 dark:bg-[#111812]/8 dark:text-[#111812]"
                          : "border-slate-300 bg-white/40 text-slate-500 dark:border-[#d8eee0]/25 dark:bg-transparent dark:text-[#d8eee0]/75",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

          </div>
        </div>

        {/* Projects Grid/List */}
        <ProjectList
          projects={projects}
          loading={loading}
          error={error}
          layout={layout}
          emptyMessage={
            search.trim()
              ? 'No projects match your search'
              : EMPTY_COPY[filter].message
          }
          emptyDescription={
            search.trim()
              ? 'Try checking for typos or searching a different term.'
              : EMPTY_COPY[filter].description
          }
          assignedTeams={assignedTeams}
          showAdminEmail={role === 'admin'}
          votedProjectId={role === 'leader' ? votedProjectId : null}
          voteCounts={voteCounts}
        />

      </div>
    </PageWrapper>
  )
}
