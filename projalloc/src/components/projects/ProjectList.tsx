import { useMemo } from 'react'
import { ProjectCard } from './ProjectCard'
import { Alert } from '@/components/ui/Alert'
import { ProjectCardSkeleton } from '@/components/ui/Skeleton'
import { sortProjectsByStatus } from '@/lib/utils'
import type { AssignedTeamInfo, Project } from '@/types'

interface ProjectListProps {
  projects: Project[]
  loading: boolean
  error: string | null
  layout?: 'grid' | 'list'
  emptyMessage?: string
  emptyDescription?: string
  assignedTeams?: Record<string, AssignedTeamInfo>
  showAdminEmail?: boolean
  /** The project ID that the current leader's team has voted for, if any */
  votedProjectId?: string | null
  /** Map of projectId → total votes cast */
  voteCounts?: Record<string, number>
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
  layout = 'grid',
  emptyMessage = 'No projects here yet',
  emptyDescription = 'Projects will appear here once an admin adds them.',
  assignedTeams = {},
  showAdminEmail = false,
  votedProjectId = null,
  voteCounts = {},
}: ProjectListProps) {
  const sorted = useMemo(() => sortProjectsByStatus(projects), [projects])

  if (loading) {
    return (
      <div className={layout === 'grid' ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
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
      <div className="rounded-2xl border border-border bg-white dark:bg-[#14120B] py-16 text-center shadow-panel">
        <EmptyIllustration />
        <p className="font-display font-bold text-text-primary text-[15px] uppercase tracking-wide">{emptyMessage}</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-text-secondary">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className={layout === 'grid' ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
      {sorted.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          assignedTeam={assignedTeams[project.id]}
          showAdminEmail={showAdminEmail}
          index={index}
          layout={layout}
          myVote={votedProjectId === project.id}
          voteCount={voteCounts[project.id] ?? 0}
        />
      ))}
    </div>
  )
}
