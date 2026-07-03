import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectList } from '@/components/projects/ProjectList'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { useUserTeam } from '@/hooks/useTeams'
import type { ProjectStatus } from '@/types'

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Open now', value: 'voting' },
  { label: 'Coming soon', value: 'upcoming' },
  { label: 'Closed', value: 'closed' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'All', value: 'all' },
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
  const [search, setSearch] = useState('')
  const { projects: allProjects, assignedTeams, loading, error } = useProjects('all')
  const { role, user } = useAuth()
  const { team } = useUserTeam(user?.email, role)

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
      <div className="relative z-10 space-y-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <header className="text-center w-full relative flex flex-col items-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Mission Log
            </h1>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text-secondary">
              Browse industry projects and pick what your team wants to work on.<br /> Active teams can vote once rounds open.
            </p>
          </header>
        </div>

        {/* If leader, show Team Workspace / CV ZIP upload */}
        {role === 'leader' && team && (
          <div className={`panel relative overflow-hidden p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
            team.cv_url
              ? 'border-accent/20 bg-accent/5 shadow-[0_2px_12px_rgba(54,242,161,0.04)]'
              : 'border-yellow/20 bg-yellow/5 shadow-[0_2px_12px_rgba(244,211,94,0.04)] animate-[pulse_3s_infinite_ease-in-out]'
          }`}>
            <div className="flex items-start gap-3">
              {team.cv_url ? (
                <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0 mt-0.5 animate-pulse-dot">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="h-9 w-9 rounded-xl bg-yellow/10 border border-yellow/25 flex items-center justify-center text-yellow shrink-0 mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              <div className="text-left">
                <h3 className="font-display text-sm font-bold text-text-primary">
                  {team.cv_url ? 'CV Submission Verified' : 'CV Upload Required'}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {team.cv_url ? (
                    <>Your team <span className="font-bold text-text-primary">{team.name}</span> has successfully uploaded a CV archive. You are eligible to participate in voting once the round opens.</>
                  ) : (
                    <>Your team <span className="font-bold text-text-primary">{team.name}</span> must upload a single ZIP containing CVs of all members to be eligible for voting.</>
                  )}
                </p>
              </div>
            </div>
            
            <Link
              to="/workspace"
              className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.97] border ${
                team.cv_url
                  ? 'border-accent bg-accent/8 text-accent hover:bg-accent hover:text-black shadow-[0_0_12px_rgba(54,242,161,0.06)]'
                  : 'border-yellow bg-yellow/8 text-yellow hover:bg-yellow hover:text-black shadow-[0_0_12px_rgba(244,211,94,0.06)]'
              }`}
            >
              <span>{team.cv_url ? 'View Workspace' : 'Upload CV Archive'}</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Controls Row: Left-aligned Filter Tabs & Right-aligned Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          {/* Left-aligned Filter Tabs */}
          <div className="flex justify-start w-full md:w-auto">
            <div className="cir-tabs flex-wrap justify-start gap-1.5 p-1.5">
              {FILTERS.map((f) => {
                const count = counts[f.value]
                const active = filter === f.value
                const inputId = `filter-board-${f.value}`

                return (
                  <div key={f.value} className="relative inline-flex items-center">
                    <input
                      type="radio"
                      id={inputId}
                      name="filter-board"
                      className="cir-tabs__r"
                      checked={active}
                      onChange={() => setFilter(f.value)}
                    />
                    <label
                      htmlFor={inputId}
                      className="cir-tabs__t flex items-center gap-2"
                    >
                      <span>{f.label}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold border transition-colors ${
                          active
                            ? 'border-bg-base/30 bg-bg-base/10 text-bg-base'
                            : 'border-text-muted/30 bg-bg-surface/50 text-text-muted'
                        }`}
                      >
                        {count}
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right-aligned Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field input-field-focus min-h-11 w-full py-2 pl-10 pr-10 text-sm"
            />
            {/* Search Glass Icon */}
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Clear Button if search has value */}
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 flex min-w-11 cursor-pointer items-center justify-center text-text-muted transition-colors hover:text-text-primary"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <ProjectList
          projects={projects}
          loading={loading}
          error={error}
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
        />
      </div>
    </PageWrapper>
  )
}
