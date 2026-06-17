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
      <div className="relative z-10 space-y-8">
        <header className="page-header pt-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
            FITsp
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Project Board
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text-secondary">
            Browse industry projects and pick what your team wants to work on. Active teams can vote once rounds open.
          </p>
        </header>

        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-bg-surface/30 backdrop-blur-md p-1 shadow-panel">
          {FILTERS.map((f) => {
            const count = counts[f.value]
            const active = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-1.5 text-[13px] font-display font-semibold transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? 'bg-accent text-black shadow-[0_4px_12px_var(--accent-glow)]'
                    : 'text-text-secondary hover:bg-bg-elevated/40 hover:text-text-primary'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    active
                      ? 'bg-black/15 text-black'
                      : 'bg-accent/8 text-accent border border-accent/15'
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
