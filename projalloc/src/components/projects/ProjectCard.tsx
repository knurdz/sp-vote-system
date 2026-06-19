import { useRef, type MouseEvent, type PointerEvent, type TouchEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'
import { STATUS_LABELS, cn } from '@/lib/utils'
import type { AssignedTeamInfo, Project, ProjectStatus } from '@/types'

interface ProjectCardProps {
  project: Project
  featured?: boolean
  assignedTeam?: AssignedTeamInfo
  showAdminEmail?: boolean
  index: number
  hoveredIndex: number | null
  onHoverStart: (index: number) => void
  onHoverEnd: () => void
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
  assignedTeam,
  index,
  hoveredIndex,
  onHoverStart,
  onHoverEnd,
}: ProjectCardProps) {
  const isVoting = project.status === 'voting'
  const isAssigned = project.status === 'assigned'
  const styles = STATUS_STYLES[project.status]

  // Shifting helper logic for when the last card in a row is expanded
  const isHovered = hoveredIndex === index
  const isLeftNeighbor = hoveredIndex !== null && index === hoveredIndex - 1
  const isHoveredCol5 = hoveredIndex !== null && hoveredIndex % 5 === 4
  const isHoveredCol4 = hoveredIndex !== null && hoveredIndex % 4 === 3
  const isHoveredCol3 = hoveredIndex !== null && hoveredIndex % 3 === 2

  const isSelfCol5 = index % 5 === 4
  const isSelfCol4 = index % 4 === 3
  const isSelfCol3 = index % 3 === 2
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)

  const toggleMobileDetails = () => {
    suppressClickRef.current = true

    if (isHovered) {
      onHoverEnd()
    } else {
      onHoverStart(index)
    }
  }

  const isSwipe = (deltaX: number, deltaY: number) =>
    Math.abs(deltaX) >= 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 640 || event.pointerType === 'touch') return

    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    suppressClickRef.current = false
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current
    pointerStartRef.current = null

    if (!start || window.innerWidth >= 640 || event.pointerType === 'touch') return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y

    if (!isSwipe(deltaX, deltaY)) return

    event.preventDefault()
    toggleMobileDetails()
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 640) return

    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    suppressClickRef.current = false
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null

    if (!start || !touch || window.innerWidth >= 640) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    if (!isSwipe(deltaX, deltaY)) return

    event.preventDefault()
    toggleMobileDetails()
  }

  const handleLinkClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!suppressClickRef.current) return

    event.preventDefault()
    suppressClickRef.current = false
  }

  return (
    <div
      data-project-card-index={index}
      className={cn(
        "flip-card-container w-full relative",
        // Shifting classes for left neighbors of hovered last-column cards
        isLeftNeighbor && isHoveredCol5 && "xl:shift-col-1",
        isLeftNeighbor && isHoveredCol4 && "lg:shift-col-1 xl:col-start-auto",
        isLeftNeighbor && isHoveredCol3 && "md:shift-col-1 lg:col-start-auto",
        // Expansion classes for the hovered card itself
        isHovered && "expanded-card is-hovered",
        isHovered && isSelfCol5 && "xl:expanded-card-left-5n",
        isHovered && isSelfCol4 && "lg:expanded-card-left-4n xl:expanded-card-left-auto",
        isHovered && isSelfCol3 && "md:expanded-card-left-3n lg:expanded-card-left-auto"
      )}
      onMouseLeave={onHoverEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null
      }}
    >
      <div
        className={cn(
          "flip-card w-full h-full card shadow-panel transition-all duration-300",
          styles.border,
          styles.hoverBorder,
          styles.hoverShadow
        )}
      >
        <Link
          to={`/project/${project.id}`}
          className="block w-full h-full relative"
          onClickCapture={handleLinkClickCapture}
        >
          {/* Hover hotspot trigger to prevent accidental edge-hovers from expanding card */}
          {!isHovered && (
            <div
              className="absolute inset-0 m-auto w-[55%] h-[55%] z-30"
              onMouseEnter={() => onHoverStart(index)}
            />
          )}
          <div className="flip-card-inner">
            
            {/* FRONT FACE: Name and Company */}
            <div className="flip-card-front">
              <article
                className="relative flex h-full flex-col justify-between overflow-hidden p-4 sm:p-5"
              >
                {/* Colored top gradient line */}
                <div
                  className={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', styles.top)}
                  aria-hidden
                />
  
                {/* Top Row: Company */}
                <div className="flex items-center justify-center gap-3 w-full mt-1.5">
                  <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.15em] text-text-muted truncate flex-1 text-center">
                    {project.company}
                  </p>
                </div>
  
                {/* Title Center */}
                <div className="flex-1 flex flex-col justify-center my-2 text-center">
                  <h3
                    className={cn(
                      'font-display font-bold leading-snug text-text-primary tracking-tight text-center uppercase text-[15px] sm:text-[16px] line-clamp-3',
                      styles.hoverTitle
                    )}
                  >
                    {project.title}
                  </h3>
                </div>

                <p className="sm:hidden text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Slide for more details
                </p>
  
              </article>
            </div>
  
            {/* BACK FACE: Detailed Information */}
            <div className="flip-card-back">
              <article
                className="relative flex h-full flex-col justify-between overflow-hidden p-5 sm:p-6"
              >
                {/* Colored top gradient line */}
                <div
                  className={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', styles.top)}
                  aria-hidden
                />
  
                {/* Header & Title */}
                <div className="relative flex flex-col items-center">
                  <div className="flex items-center justify-center w-full mt-1">
                    <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.15em] text-text-muted truncate text-center w-full px-12">
                      {project.company}
                    </p>
                    <Badge variant={project.status} className="shrink-0 scale-90 absolute right-0 top-0 origin-top-right">
                      {STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                  
                  <h4 className="font-display font-black leading-tight text-text-primary tracking-tight text-center uppercase text-[17px] sm:text-[19px] mt-3">
                    {project.title}
                  </h4>
                  <div className="w-10 h-0.5 bg-accent/40 rounded mt-2.5 mb-3.5 mx-auto" />
                </div>

                {/* Description & Added Date */}
                <div className="flex-1 text-center min-h-0 overflow-hidden mb-4 flex flex-col items-center">
                  <p className="text-[13px] leading-relaxed text-text-secondary mb-3">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Added {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
  
                <div className="space-y-3.5">
                  {/* Tech Stack */}
                  {project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {project.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md border border-border bg-bg-surface/60 px-2.5 py-0.5 font-mono text-[9.5px] text-text-secondary hover:border-accent/30 transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
    
                  {/* Bottom metadata panel */}
                  {((isAssigned && assignedTeam) || isVoting) && (
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-bg-surface/30 px-3.5 py-2 w-full text-[11px] text-text-secondary">
                        {isAssigned && assignedTeam ? (
                          <div className="truncate flex-1 text-left">
                            <span className="text-text-muted">Assigned: </span>
                            <span className="font-display font-bold text-accent">{assignedTeam.name}</span>
                          </div>
                        ) : (
                          <div className="flex-1" />
                        )}
    
                        {isVoting && (
                          <Countdown
                            deadline={project.voting_deadline}
                            className="w-fit rounded-lg bg-accent/8 border border-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold text-accent shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </div>
  
          </div>
        </Link>
      </div>
    </div>
  )
}
