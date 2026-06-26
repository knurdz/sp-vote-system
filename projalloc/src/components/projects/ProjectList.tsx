import { useMemo, useState } from 'react'
import { ProjectCard } from './ProjectCard'
import { Alert } from '@/components/ui/Alert'
import { ProjectCardSkeleton } from '@/components/ui/Skeleton'
import { sortProjectsByStatus, cn } from '@/lib/utils'
import type { AssignedTeamInfo, Project } from '@/types'

interface ProjectListProps {
  projects: Project[]
  loading: boolean
  error: string | null
  emptyMessage?: string
  emptyDescription?: string
  assignedTeams?: Record<string, AssignedTeamInfo>
  showAdminEmail?: boolean
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

export function ProjectList({
  projects,
  loading,
  error,
  emptyMessage = 'No projects here yet',
  emptyDescription = 'Projects will appear here once an admin adds them.',
  assignedTeams = {},
  showAdminEmail = false,
}: ProjectListProps) {
  const sorted = useMemo(() => sortProjectsByStatus(projects), [projects])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return <Alert message={error} />
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-card border border-border bg-bg-surface/50 backdrop-blur-md py-20 text-center shadow-panel">
        <EmptyIllustration />
        <p className="font-display font-semibold text-text-primary text-[17px]">{emptyMessage}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-45 bg-black/15 backdrop-blur-[6px] transition-all duration-300 opacity-0 pointer-events-none",
          hoveredIndex !== null && "opacity-100 pointer-events-auto sm:pointer-events-none"
        )}
        onClick={() => setHoveredIndex(null)}
      />
      <div className="grid grid-cols-1 grid-flow-row-dense gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sorted.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            featured={project.status === 'voting'}
            assignedTeam={assignedTeams[project.id]}
            showAdminEmail={showAdminEmail}
            index={index}
            hoveredIndex={hoveredIndex}
            onHoverStart={setHoveredIndex}
            onHoverEnd={() => setHoveredIndex(null)}
          />
        ))}
      </div>
    </>
  )
}
