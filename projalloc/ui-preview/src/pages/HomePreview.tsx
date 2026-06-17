import { useMemo, useState } from 'react'
import { ProjectList } from '@/components/projects/ProjectList'
import { CrossHatchDecoration, CyanGlow, LightningAccent, EnergyBorder } from '@/components/fx'
import { Button } from '@/components/ui/Button'
import { PreviewPageWrapper } from '@preview/components/PreviewPageWrapper'
import { MOCK_PROJECTS } from '@preview/mockProjects'
import type { ProjectStatus } from '@/types'

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Voting Open', value: 'voting' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Closed', value: 'closed' },
  { label: 'Assigned', value: 'assigned' },
]

export function HomePreview() {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')

  const projects = useMemo(
    () =>
      filter === 'all'
        ? MOCK_PROJECTS
        : MOCK_PROJECTS.filter((p) => p.status === filter),
    [filter],
  )

  const counts = useMemo(
    () => ({
      all: MOCK_PROJECTS.length,
      voting: MOCK_PROJECTS.filter((p) => p.status === 'voting').length,
      upcoming: MOCK_PROJECTS.filter((p) => p.status === 'upcoming').length,
      closed: MOCK_PROJECTS.filter((p) => p.status === 'closed').length,
      assigned: MOCK_PROJECTS.filter((p) => p.status === 'assigned').length,
    }),
    [],
  )

  return (
    <PreviewPageWrapper>
      <header className="relative mb-10 overflow-hidden">
        <CrossHatchDecoration
          variant="circle"
          className="absolute -left-12 top-0 opacity-25"
          seed={3}
        />
        <CrossHatchDecoration
          variant="rect"
          className="absolute -right-16 top-8 opacity-20"
          seed={11}
        />
        <LightningAccent
          variant="hero"
          className="absolute left-1/2 top-0 -translate-x-1/2 opacity-60"
        />

        <div className="relative z-10">
          <p className="font-mono text-[12px] tracking-[0.12em] text-cyan">
            PROJECT ALLOCATION
          </p>
          <CyanGlow intensity="soft" className="inline-block">
            <h1 className="font-display mt-2 text-[40px] font-bold leading-tight tracking-tight text-text-primary sm:text-[44px]">
              Project Board
            </h1>
          </CyanGlow>
          <p className="mt-2 max-w-lg text-[15px] text-text-secondary">
            Industry software projects available for team allocation
          </p>
        </div>
      </header>

      <div className="mb-8 inline-flex rounded-xl border border-[var(--border-cyan)] bg-[var(--panel-bg)] p-1 backdrop-blur-sm">
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
                  ? 'bg-accent text-midnight shadow-glow-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  active
                    ? 'bg-midnight/20 text-midnight'
                    : 'bg-accent-glow text-cyan'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <ProjectList projects={projects} loading={false} error={null} />

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <EnergyBorder pulse>
          <div className="p-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-cyan">CTA Preview</p>
            <h2 className="font-display mt-2 text-xl font-bold text-text-primary">Primary Action</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Energy border with animated pulse on primary buttons.
            </p>
            <Button size="lg" className="mt-4">
              Vote Now
            </Button>
          </div>
        </EnergyBorder>

        <div className="panel p-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-cyan">Components</p>
          <h2 className="font-display mt-2 text-xl font-bold text-text-primary">Button Variants</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>
      </section>
    </PreviewPageWrapper>
  )
}
