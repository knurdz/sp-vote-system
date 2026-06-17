import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'
import { STATUS_LABELS, cn, truncate } from '@/lib/utils'
import type { AssignedTeamInfo, Project, ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: Project
  featured?: boolean
  assignedTeam?: AssignedTeamInfo
  showAdminEmail?: boolean
}

const STATUS_STYLES: Record<
  ProjectStatus,
  { top: string; hoverBorder: string; hoverTitle: string; border?: string; hoverShadow: string }
> = {
  voting: {
    top: 'from-accent/80 via-accent/40 to-transparent',
    hoverBorder: 'hover:border-accent/30',
    hoverTitle: 'group-hover:text-accent',
    border: 'border-accent/15',
    hoverShadow: 'hover:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.18),0_0_24px_rgba(0,201,120,0.08)]',
  },
  upcoming: {
    top: 'from-yellow/80 via-yellow/30 to-transparent',
    hoverBorder: 'hover:border-yellow/30',
    hoverTitle: 'group-hover:text-yellow',
    border: 'border-yellow/15',
    hoverShadow: 'hover:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.18),0_0_24px_rgba(245,158,11,0.08)]',
  },
  closed: {
    top: 'from-gray/60 via-gray/20 to-transparent',
    hoverBorder: 'hover:border-border/80',
    hoverTitle: 'group-hover:text-text-primary',
    border: 'border-border',
    hoverShadow: 'hover:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.18)]',
  },
  assigned: {
    top: 'from-status-assigned/80 via-status-assigned/40 to-transparent',
    hoverBorder: 'hover:border-status-assigned/30',
    hoverTitle: 'group-hover:text-status-assigned',
    border: 'border-status-assigned/15',
    hoverShadow: 'hover:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.18),0_0_24px_rgba(59,130,246,0.08)]',
  },
}

export function ProjectCard({
  project,
  featured = false,
  assignedTeam,
  showAdminEmail = false,
}: ProjectCardProps) {
  const isVoting = project.status === 'voting'
  const isAssigned = project.status === 'assigned'
  const styles = STATUS_STYLES[project.status]

  return (
    <Link to={`/project/${project.id}`} className="group block h-full">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-bg-surface backdrop-blur-md shadow-panel transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
          'hover:-translate-y-1',
          styles.hoverBorder,
          styles.hoverShadow,
          styles.border,
        )}
      >
        <div
          className={cn('h-1.5 w-full bg-gradient-to-r', styles.top)}
          aria-hidden
        />

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                {project.company}
              </p>
              <h3
                className={cn(
                  'mt-2 font-display font-bold leading-snug text-text-primary transition-colors',
                  styles.hoverTitle,
                  featured ? 'text-[20px] sm:text-[22px] tracking-tight' : 'text-[17px] sm:text-[18px]',
                )}
              >
                {project.title}
              </h3>
            </div>
            <Badge variant={project.status} className="shrink-0">
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>

          {(featured || project.description) && (
            <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-text-secondary">
              {truncate(project.description, featured ? 160 : 100)}
            </p>
          )}

          {project.tech_stack.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tech_stack.slice(0, featured ? 5 : 3).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border/70 bg-bg-elevated/40 px-2 py-0.5 font-mono text-[10px] text-text-secondary"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-5 sm:pt-6">
            <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-bg-elevated/30 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              {isAssigned && assignedTeam ? (
                <div className="text-[12px] text-text-secondary">
                  <span className="text-text-muted">Assigned: </span>
                  <span className="font-display font-bold text-accent">{assignedTeam.name}</span>
                  {showAdminEmail && assignedTeam.leaderEmail && (
                    <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                      {assignedTeam.leaderEmail}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <svg
                    className="h-4 w-4 shrink-0 text-text-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <span>
                    Team size:{' '}
                    <span className="font-display font-bold text-text-primary">{project.team_size}</span>
                  </span>
                </div>
              )}

              {isVoting && (
                <Countdown
                  deadline={project.voting_deadline}
                  className="w-fit rounded-lg bg-accent/8 border border-accent/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-accent"
                />
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
