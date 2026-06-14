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

  return (
    <PageWrapper>
      <div className="relative z-10">
        <header className="page-header">
          <p className="font-mono text-[12px] tracking-[0.08em] text-accent">
            PROJECT ALLOCATION
          </p>
          <h1 className="mt-2 text-[40px] font-bold leading-tight text-text-primary">
            Project Board
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            Browse industry projects and pick what your team wants to work on
          </p>
        </header>

        <div className="section-gap inline-flex flex-wrap gap-1 rounded-xl border border-border bg-bg-surface p-1">
          {FILTERS.map((f) => {
            const count = counts[f.value]
            const active = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? 'bg-accent text-black shadow-[0_0_16px_rgba(0,201,120,0.35)]'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                    active
                      ? 'bg-black/20 text-black'
                      : 'bg-accent-glow text-accent'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
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
      </div>
    </PageWrapper>
  )
}
