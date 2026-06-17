import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'
import { STATUS_LABELS, cn, truncate } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: Project
  featured?: boolean
}

const STATUS_STYLES: Record<
  ProjectStatus,
  { top: string; hoverBorder: string; hoverTitle: string; border?: string }
> = {
  voting: {
    top: 'from-cyan/80 via-cyan/40 to-transparent',
    hoverBorder: 'hover:border-cyan/35',
    hoverTitle: 'group-hover:text-ice',
    border: 'border-cyan/25',
  },
  upcoming: {
    top: 'from-yellow/70 via-yellow/30 to-transparent',
    hoverBorder: 'hover:border-yellow/35',
    hoverTitle: 'group-hover:text-yellow',
  },
  closed: {
    top: 'from-steel/60 via-steel/20 to-transparent',
    hoverBorder: 'hover:border-steel/50',
    hoverTitle: 'group-hover:text-text-primary',
  },
  assigned: {
    top: 'from-ice/80 via-ice/40 to-transparent',
    hoverBorder: 'hover:border-ice/30',
    hoverTitle: 'group-hover:text-ice',
    border: 'border-ice/20',
  },
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const isVoting = project.status === 'voting'
  const styles = STATUS_STYLES[project.status]

  return (
    <Link to={`/project/${project.id}`} className="group block h-full">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-card border border-[var(--border-cyan)] bg-[var(--panel-bg)] backdrop-blur-sm transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(1,28,64,0.5),0_0_20px_rgba(84,172,191,0.1)]',
          styles.hoverBorder,
          styles.border,
        )}
      >
        <div
          className={cn('h-1 w-full bg-gradient-to-r', styles.top)}
          aria-hidden
        />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                {project.company}
              </p>
              <h3
                className={cn(
                  'mt-1.5 font-semibold leading-snug text-text-primary transition-colors',
                  styles.hoverTitle,
                  featured ? 'text-[18px] sm:text-[20px]' : 'text-[16px] sm:text-[17px]',
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
            <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-text-secondary">
              {truncate(project.description, featured ? 140 : 90)}
            </p>
          )}

          {project.tech_stack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tech_stack.slice(0, featured ? 4 : 3).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-secondary"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 sm:pt-5">
            <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-bg-elevated/60 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                <span>
                  Team of <span className="font-medium text-text-primary">{project.team_size}</span>
                </span>
              </div>

              {isVoting && (
                <Countdown
                  deadline={project.voting_deadline}
                  className="w-fit rounded-md bg-accent/10 px-2 py-0.5 text-[12px]"
                />
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
