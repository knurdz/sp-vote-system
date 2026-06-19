import { useMemo, useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectList } from '@/components/projects/ProjectList'
import { ProjectWheel } from '@/components/projects/ProjectWheel'
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
  const [viewMode, setViewMode] = useState<'tile' | 'wheel'>(() => {
    return (localStorage.getItem('projalloc_view_mode') as 'tile' | 'wheel') || 'wheel'
  })
  const { projects: allProjects, assignedTeams, loading, error } = useProjects('all')
  const { role } = useAuth()

  const projects = useMemo(
    () =>
      filter === 'all'
        ? allProjects
        : allProjects.filter((p) => p.status === filter),
    [allProjects, filter],
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

  const handleViewModeChange = (mode: 'tile' | 'wheel') => {
    setViewMode(mode)
    localStorage.setItem('projalloc_view_mode', mode)
  }

  return (
    <PageWrapper>
      <div className="relative z-10 space-y-8">
        {/* View Switcher Toggle & Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          {viewMode === 'wheel' ? (
            // Center top title format matching reference image
            <header className="text-center w-full relative flex flex-col items-center">
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary uppercase">
                FITsp
              </h1>
              <p className="mt-1 font-display text-base sm:text-lg font-semibold tracking-wide text-text-secondary">
                Project Wheel
              </p>

              {/* Filter Pills right below Project Wheel text */}
              <div className="mt-4 sm:mt-5 flex justify-center relative z-20">
                <div className="cir-tabs flex-wrap justify-center gap-1.5 p-1.5">
                  {FILTERS.filter(f => f.value !== 'all').map((f) => {
                    const count = counts[f.value]
                    const active = filter === f.value
                    const displayLabel = f.label === 'Open now' ? 'Open Now' : f.label === 'Coming soon' ? 'Coming Soon' : f.label
                    const inputId = `filter-wheel-${f.value}`

                    return (
                      <div key={f.value} className="relative inline-flex items-center">
                        <input
                          type="radio"
                          id={inputId}
                          name="filter-wheel"
                          className="cir-tabs__r"
                          checked={active}
                          onChange={() => setFilter(f.value)}
                        />
                        <label
                          htmlFor={inputId}
                          className="cir-tabs__t flex items-center gap-2"
                        >
                          <span>{displayLabel}</span>
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

              {/* Absolute view toggler to remain clean on larger displays */}
              <div className="absolute right-0 top-4 hidden sm:inline-flex rounded-xl border border-border bg-bg-surface/30 backdrop-blur-md p-0.5 shadow-panel">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('wheel')}
                  className="cursor-pointer select-none rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all duration-200 bg-accent text-black shadow-sm"
                >
                  Wheel View
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('tile')}
                  className="cursor-pointer select-none rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all duration-200 text-text-secondary hover:text-text-primary"
                >
                  Grid View
                </button>
              </div>
            </header>
          ) : (
            // Centered header for standard tile view
            <header className="text-center w-full relative flex flex-col items-center">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-accent hidden">
                FITsp
              </p>
              <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
                Project Board
              </h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text-secondary">
                Browse industry projects and pick what your team wants to work on. Active teams can vote once rounds open.
              </p>

              {/* Absolute view toggler to remain clean on larger displays */}
              <div className="absolute right-0 top-4 hidden sm:inline-flex rounded-xl border border-border bg-bg-surface/30 backdrop-blur-md p-0.5 shadow-panel">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('wheel')}
                  className="cursor-pointer select-none rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all duration-200 text-text-secondary hover:text-text-primary"
                >
                  Wheel View
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('tile')}
                  className="cursor-pointer select-none rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all duration-200 bg-accent text-black shadow-sm"
                >
                  Grid View
                </button>
              </div>
            </header>
          )}
        </div>

        {/* Mobile View Toggler for Wheel View */}
        {viewMode === 'wheel' && (
          <div className="flex sm:hidden justify-center w-full">
            <div className="inline-flex rounded-xl border border-border bg-bg-surface/30 backdrop-blur-md p-0.5 shadow-panel">
              <button
                type="button"
                onClick={() => handleViewModeChange('wheel')}
                className="cursor-pointer select-none rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all duration-200 bg-accent text-black shadow-sm"
              >
                Wheel View
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('tile')}
                className="cursor-pointer select-none rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all duration-200 text-text-secondary hover:text-text-primary"
              >
                Grid View
              </button>
            </div>
          </div>
        )}

        {/* Conditional body content */}
        {viewMode === 'wheel' ? (
          <ProjectWheel
            projects={projects}
          />
        ) : (
          <>
            <div className="flex justify-center w-full mb-8 mt-2">
              <div className="cir-tabs flex-wrap justify-center gap-1.5 p-1.5">
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

            <ProjectList
              projects={projects}
              loading={loading}
              error={error}
              emptyMessage={EMPTY_COPY[filter].message}
              emptyDescription={EMPTY_COPY[filter].description}
              assignedTeams={assignedTeams}
              showAdminEmail={role === 'admin'}
            />
          </>
        )}
      </div>
    </PageWrapper>
  )
}
