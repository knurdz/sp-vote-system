import { useMemo, useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectList } from '@/components/projects/ProjectList'
import { useProjects } from '@/hooks/useProjects'
import type { ProjectStatus } from '@/types'

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Voting Open', value: 'voting' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Closed', value: 'closed' },
  { label: 'Assigned', value: 'assigned' },
]

export function Home() {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const { projects: allProjects, loading, error } = useProjects('all')

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
      <header className="mb-10">
        <p className="font-mono text-[12px] tracking-[0.08em] text-accent">
          PROJECT ALLOCATION
        </p>
        <h1 className="mt-2 text-[40px] font-bold leading-tight text-text-primary">
          Project Board
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Industry software projects available for team allocation
        </p>
      </header>

      <div className="mb-8 inline-flex rounded-xl border border-border bg-bg-surface p-1">
        {FILTERS.map((f) => {
          const count = counts[f.value]
          const active = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`flex cursor-pointer select-none items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-accent text-black shadow-accent-glow'
                  : 'text-text-secondary hover:text-text-primary'
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

      <ProjectList projects={projects} loading={loading} error={error} />
    </PageWrapper>
  )
}
