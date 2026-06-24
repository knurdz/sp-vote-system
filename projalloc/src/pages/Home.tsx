import { useMemo, useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectList } from '@/components/projects/ProjectList'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
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
  const { role } = useAuth()

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
