import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { STATUS_LABELS } from '@/lib/utils'
import type { Project } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'

interface ProjectWheelProps {
  projects: Project[]
}

export function ProjectWheel({
  projects,
}: ProjectWheelProps) {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollTime = useRef(0)
  const touchStart = useRef(0)
  const [isMobile, setIsMobile] = useState(false)

  // Track viewport width for mobile layout responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])


  // Reset active index when list of projects changes
  useEffect(() => {
    setActiveIndex(0)
  }, [projects])

  // Fetch all vote counts across all projects in one query
  const fetchVoteCounts = async () => {
    try {
      const { data, error } = await supabase.from('votes').select('project_id')
      if (error) throw error
      if (data) {
        const countsMap: Record<string, number> = {}
        data.forEach((vote) => {
          countsMap[vote.project_id] = (countsMap[vote.project_id] || 0) + 1
        })
        setVoteCounts(countsMap)
      }
    } catch (err) {
      console.error('Error fetching vote counts:', err)
    }
  }

  useEffect(() => {
    fetchVoteCounts()
    // Poll every 15 seconds to sync with application polling interval
    const interval = setInterval(fetchVoteCounts, 15000)
    return () => clearInterval(interval)
  }, [])

  // Mouse wheel snap scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelEvent = (e: WheelEvent) => {
      // Intercept page scrolling only if we are scrolling over the carousel
      e.preventDefault()

      const now = Date.now()
      if (now - lastScrollTime.current < 250) return // Cooldown threshold for smoothness

      if (e.deltaY > 0 || e.deltaX > 0) {
        setActiveIndex((prev) => Math.min(projects.length - 1, prev + 1))
        lastScrollTime.current = now
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        setActiveIndex((prev) => Math.max(0, prev - 1))
        lastScrollTime.current = now
      }
    }

    container.addEventListener('wheel', handleWheelEvent, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheelEvent)
    }
  }, [projects.length])

  // Arrow key scroll support
  useEffect(() => {
    if (projects.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return
      }

      if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()

        const now = Date.now()
        if (now - lastScrollTime.current < 250) return

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          setActiveIndex((prev) => Math.min(projects.length - 1, prev + 1))
          lastScrollTime.current = now
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          setActiveIndex((prev) => Math.max(0, prev - 1))
          lastScrollTime.current = now
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [projects.length])


  // Mobile touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart.current - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveIndex((prev) => Math.min(projects.length - 1, prev + 1))
      } else {
        setActiveIndex((prev) => Math.max(0, prev - 1))
      }
    }
  }

  // Handle click on outer cards to center them, and active card to open details
  const handleCardClick = (index: number, projectId: string) => {
    if (index === activeIndex) {
      navigate(`/project/${projectId}`)
    } else {
      setActiveIndex(index)
    }
  }

  const getCardStyle = (index: number) => {
    const offset = index - activeIndex
    const absOffset = Math.abs(offset)

    // Translate Y: curved "smile" offset compressed on mobile
    const translateY = -Math.pow(absOffset, 1.45) * (isMobile ? 18 : 32)

    // Translate X: dynamic spacing compressed for smaller screens
    const translateX = Math.sign(offset) * (Math.pow(absOffset, 0.9) * (isMobile ? 120 : 230))

    // Rotation: fan cards outward relative to active center
    const rotate = offset * -5

    // Scale: shrink cards as they get farther (smaller starting scale on mobile)
    const scale = (isMobile ? 0.82 : 1) - absOffset * (isMobile ? 0.15 : 0.125)

    // Opacity: fade out farther cards
    const opacity = Math.max(isMobile ? 0.05 : 0.12, 1 - absOffset * 0.28)

    // zIndex: center card has highest layering priority
    const zIndex = 100 - absOffset

    return {
      transform: `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0) scale(${scale}) rotate(${rotate}deg)`,
      opacity,
      zIndex,
      pointerEvents: absOffset === 0 ? ('auto' as const) : ('none' as const),
    }
  }

  // Define filter labels & mapping for the bottom pills
  return (
    <div className="flex flex-col items-center justify-between min-h-[580px] w-full py-6">
      {/* 3D Wheel Stage Area */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[340px] sm:h-[420px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        {projects.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <svg
              className="mb-4 h-14 w-14 text-accent/30"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden
            >
              <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M8 22h48" stroke="currentColor" strokeWidth="2" />
              <rect x="16" y="30" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="34" y="30" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p className="font-display font-semibold text-text-primary text-lg">
              No projects found
            </p>
            <p className="max-w-xs mt-1.5 text-xs text-text-muted">
              Try switching your filter status at the bottom to view other projects.
            </p>
          </div>
        ) : (
          projects.map((project, index) => {
            const isActive = index === activeIndex
            const votes = voteCounts[project.id] ?? 0

            return (
              <div
                key={project.id}
                onClick={() => handleCardClick(index, project.id)}
                style={getCardStyle(index)}
                className={`absolute left-1/2 transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1) flex flex-col items-center justify-between p-4 sm:p-6 ${
                  isActive
                    ? 'w-[270px] sm:w-[350px] h-[310px] sm:h-[390px] top-[48%] sm:top-[52%] border-accent shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_30px_rgba(0,201,120,0.1)] rounded-[24px] sm:rounded-[32px] border bg-bg-surface backdrop-blur-xl'
                    : 'w-[210px] sm:w-[270px] h-[250px] sm:h-[310px] top-[54%] sm:top-[60%] border-border/60 shadow-lg cursor-pointer hover:border-border rounded-[20px] sm:rounded-[28px] border bg-bg-surface/90 backdrop-blur-md'
                }`}
              >
                {isActive ? (
                  <div className="w-full flex flex-col items-stretch h-full justify-between">
                    {/* Header: Title & Company and Status Badge */}
                    <div className="flex items-start justify-between gap-2.5 w-full">
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted truncate">
                          {project.company}
                        </p>
                        <h3 className="mt-1 font-display font-extrabold text-sm sm:text-base tracking-tight text-text-primary line-clamp-2 leading-tight uppercase">
                          {project.title}
                        </h3>
                      </div>
                      <Badge variant={project.status} className="shrink-0 scale-90 origin-top-right">
                        {STATUS_LABELS[project.status]}
                      </Badge>
                    </div>

                    {/* Description */}
                    <div className="w-full text-left my-2.5">
                      <p className="line-clamp-3 sm:line-clamp-4 text-[12px] sm:text-[13px] leading-relaxed text-text-secondary">
                        {project.description}
                      </p>
                    </div>

                    {/* Tech Stack Badges */}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="w-full flex flex-wrap gap-1.5 justify-start my-2">
                        {project.tech_stack.slice(0, isMobile ? 3 : 5).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md border border-border bg-bg-elevated/45 px-2 py-0.5 font-mono text-[9px] sm:text-[10px] text-text-secondary"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Row: Countdown (Only for voting projects) */}
                    {project.status === 'voting' && (
                      <div className="w-full mt-auto flex items-center justify-center rounded-xl border border-border/50 bg-bg-elevated/30 p-2 sm:p-2.5">
                        <Countdown
                          deadline={project.voting_deadline}
                          className="w-fit rounded-lg bg-accent/8 border border-accent/15 px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-accent"
                        />
                      </div>
                    )}

                    {/* Footer link to See More */}
                    <div className="w-full mt-2.5">
                      <Link
                        to={`/project/${project.id}`}
                        className="block w-full py-2 rounded-xl bg-[#c5e2f6] border border-black/10 text-slate-900 font-display font-bold text-[10.5px] sm:text-[11.5px] text-center transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-sm hover:bg-[#b0d6f2]"
                      >
                        See More
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header: Title & Company */}
                    <div className="text-center w-full mt-1 sm:mt-2">
                      <h3 className="font-display font-extrabold text-base sm:text-lg tracking-tight text-text-primary line-clamp-2 leading-tight uppercase">
                        {project.title}
                      </h3>
                      <p className="mt-1 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">
                        {project.company}
                      </p>
                    </div>

                    {/* Body: Giant Background Vote Count and Status */}
                    <div className="flex-1 flex flex-col items-center justify-center relative w-full my-2 sm:my-3">
                      {/* Huge Background Number */}
                      <div className="absolute font-display font-black text-[55px] sm:text-[75px] leading-none select-none text-text-muted/10 tracking-tighter">
                        {votes}
                      </div>

                      {/* Status Overlay */}
                      <div className="z-10 text-center flex flex-col items-center">
                        <span className="font-display font-bold text-[9px] sm:text-[10px] uppercase tracking-widest text-text-primary">
                          {STATUS_LABELS[project.status]}
                        </span>
                        <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.25em] text-text-muted mt-0.5">
                          VOTES
                        </span>
                      </div>
                    </div>

                    {/* Subtle indicator or placeholder so layout heights are identical */}
                    <div className="h-0 opacity-0" />
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Range Slider for mobile view fast navigation */}
      {isMobile && projects.length > 1 && (
        <div className="w-full max-w-[280px] px-4 py-2 mt-3 mb-5 flex flex-col items-center gap-1.5 z-30">
          <input
            type="range"
            min={0}
            max={projects.length - 1}
            value={activeIndex}
            onChange={(e) => setActiveIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between w-full text-[10px] font-mono text-text-muted px-1 mt-0.5">
            <span>1</span>
            <span className="font-semibold text-text-secondary">Slide to browse ({activeIndex + 1}/{projects.length})</span>
            <span>{projects.length}</span>
          </div>
        </div>
      )}

      {/* Description Layout Panel matching reference image */}
      <div className="relative w-full max-w-7xl mx-auto px-6 mt-[-10px] z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {/* Left Description Column */}
          <div className="text-left max-w-xs justify-self-start hidden md:block">
            <p className="text-sm font-sans leading-relaxed text-text-secondary">
              Browse industry projects.<br />
              Pick what your team wants to work on.<br />
              Active teams can vote once rounds open.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden md:block h-0"></div>

          {/* Right Description Column */}
          <div className="text-right max-w-xs justify-self-end hidden md:block">
            <p className="text-sm font-sans leading-relaxed text-text-secondary">
              Teams will receive projects with a<br />
              full transparent selection process.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
