import { useMemo } from 'react'
import { ProjectCard } from './ProjectCard'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import type { Project, ProjectStatus } from '@/types'

interface ProjectListProps {
  projects: Project[]
  loading: boolean
  error: string | null
}

const STATUS_ORDER: Record<ProjectStatus, number> = {
  voting: 0,
  upcoming: 1,
  closed: 2,
  assigned: 3,
}

function EmptyIllustration() {
  return (
    <svg
      className="mx-auto mb-4 h-16 w-16 text-accent/40"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M8 22h48" stroke="currentColor" strokeWidth="2" />
      <rect x="16" y="30" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="30" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ProjectList({ projects, loading, error }: ProjectListProps) {
  const sorted = useMemo(
    () =>
      [...projects].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      ),
    [projects],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return <Alert message={error} />
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-card border border-border bg-bg-surface py-20 text-center">
        <EmptyIllustration />
        <p className="text-text-secondary">No projects here yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          featured={project.status === 'voting'}
        />
      ))}
    </div>
  )
}
