import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Countdown } from '@/components/ui/Countdown'
import { Alert } from '@/components/ui/Alert'
import { ProjectDetailSkeleton } from '@/components/ui/Skeleton'
import { VoteButton } from '@/components/voting/VoteButton'
import { VoterList } from '@/components/voting/VoterList'
import { Button } from '@/components/ui/Button'
import { useProject } from '@/hooks/useProjects'
import { useSpinEvent } from '@/hooks/useSpinEvent'
import { useVotes } from '@/hooks/useVotes'
import { useTeams } from '@/hooks/useTeams'
import { useAuth } from '@/hooks/useAuth'
import { AssignTeamModal } from '@/components/projects/AssignTeamModal'
import { formatDateTime, STATUS_LABELS } from '@/lib/utils'

type TabType = 'details' | 'voters' | 'spin'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { project, loading: projectLoading, error: projectError, refetch: refetchProject } = useProject(id)
  const { spinEvent, spinLog, candidates, loading: spinLoading, refetch: refetchSpin } = useSpinEvent(id)
  const { votes, loading: votesLoading } = useVotes(id)
  const { teams, loading: teamsLoading } = useTeams()
  const { role } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  useEffect(() => {
    if (project?.cv_required && activeTab === 'spin') {
      setActiveTab('details')
    }
  }, [project, activeTab])

  if (projectLoading || votesLoading || teamsLoading) {
    return (
      <PageWrapper>
        <ProjectDetailSkeleton />
      </PageWrapper>
    )
  }

  if (projectError || !project) {
    return (
      <PageWrapper>
        <Alert message={projectError ?? 'Project not found'} />
      </PageWrapper>
    )
  }

  const winningTeam = spinLog?.winning_team_name

  const tabs = [
    {
      type: 'details' as TabType,
      label: 'Project Details',
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      type: 'voters' as TabType,
      label: `Voter Teams (${votes.length})`,
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    ...(!project?.cv_required ? [
      {
        type: 'spin' as TabType,
        label: 'Spin Wheel',
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )
      }
    ] : [])
  ]

  const statusBadges = (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
        <span>{STATUS_LABELS[project.status]}</span>
      </span>
      {votes.length > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
          <span>Votes: {votes.length} cast</span>
        </span>
      )}
    </>
  )

  return (
    <PageWrapper headerRight={statusBadges}>
      <div className="relative z-10 space-y-6">

        {/* Project Name and Badge Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-extrabold text-text-primary tracking-tight uppercase">
                {project.title}
              </h1>
              {project.cv_required && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-display font-extrabold bg-blue-500/15 border border-blue-500/20 text-blue-500 tracking-wide uppercase">
                  CV Required
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-display font-extrabold bg-accent/15 border border-accent/20 text-accent tracking-wide uppercase">
                Batch Allocation
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-text-secondary">{project.company}</p>
          </div>
        </div>

        {/* Sub-navigation Tabs (Mirroring Tab 1, Tab 2, Tab 3 in designs) */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-border/40 pb-0.5">
          <div className="flex gap-6 sm:gap-8">
            {tabs.map((tab) => {
              const active = activeTab === tab.type
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`pb-3 text-xs font-display font-bold uppercase tracking-wider transition-all relative shrink-0 flex items-center gap-2 cursor-pointer ${
                    active
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 5-Column Analytics Cards Row (Exact replica of the top statistics strip) */}
        <div className="rounded-2xl border border-border/70 bg-white dark:bg-[#14120B] p-5 shadow-panel">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:divide-x lg:divide-border/45">
            
            {/* Column 1 */}
            <div className="space-y-4 pl-0">
              <div className="space-y-1">
                <p className="font-display text-lg font-black text-text-primary uppercase leading-none tracking-tight">
                  {project.status === 'voting' ? 'Open' : STATUS_LABELS[project.status]}
                </p>
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  CONTRACT STATUS
                </p>
              </div>
              <div className="pt-2 border-t border-border/30">
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  START DATE
                </p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">
                  {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4 lg:pl-6">
              <div className="space-y-1">
                <p className="font-display text-lg font-black text-text-primary leading-none tracking-tight">
                  {votes.length} / {teams.length}
                </p>
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  VOTES CASTED
                </p>
              </div>
              <div className="pt-2 border-t border-border/30">
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  ELIGIBLE TEAMS
                </p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">
                  {teams.length} Teams Registered
                </p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4 lg:pl-6">
              <div className="space-y-1">
                <p className="font-display text-lg font-black text-text-primary leading-none tracking-tight">
                  {project.team_size} Members
                </p>
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  MAX TEAM SIZE
                </p>
              </div>
              <div className="pt-2 border-t border-border/30">
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  ROLE ASSIGNMENT
                </p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">
                  Min 4 - Max 6 members
                </p>
              </div>
            </div>

            {/* Column 4 */}
            <div className="space-y-4 lg:pl-6">
              <div className="space-y-1">
                <p className="font-display text-lg font-black text-text-primary uppercase leading-none tracking-tight truncate">
                  {project.company}
                </p>
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  HOST COMPANY
                </p>
              </div>
              <div className="pt-2 border-t border-border/30">
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  PARTNER STATUS
                </p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">
                  Industry Partner
                </p>
              </div>
            </div>

            {/* Column 5 */}
            <div className="space-y-4 lg:pl-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 h-[18px]">
                  {project.status === 'voting' ? (
                    <Countdown deadline={project.voting_deadline} className="font-mono text-sm font-bold text-amber-500" />
                  ) : (
                    <span className="font-display text-sm font-black text-text-muted">CLOSED</span>
                  )}
                </div>
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  VOTING REMAINING
                </p>
              </div>
              <div className="pt-2 border-t border-border/30">
                <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  DEADLINE DATE
                </p>
                <p className="text-xs font-bold text-text-secondary mt-0.5">
                  {new Date(project.voting_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Tab content panels */}
        <div className="pt-2">
          
          {/* Tab 1: Project Details Info */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main parameters description and tech stack */}
              <div className="lg:col-span-2 space-y-6">
                <section className="rounded-2xl border border-border bg-white dark:bg-[#14120B] p-6 sm:p-8 shadow-panel">
                  <h2 className="mb-4 font-display text-md font-bold text-text-primary uppercase tracking-wide">
                    Project Description
                  </h2>
                  <p className="leading-relaxed text-text-secondary text-sm">{project.description}</p>
                </section>

                <section className="rounded-2xl border border-border bg-white dark:bg-[#14120B] p-6 sm:p-8 shadow-panel">
                  <h2 className="mb-4 font-display text-md font-bold text-text-primary uppercase tracking-wide">
                    Technology Stack
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    {project.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="font-mono rounded-lg border border-border bg-bg-base px-3 py-1.5 text-xs text-text-secondary font-semibold hover:border-accent hover:text-accent transition-colors duration-150"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {/* Sidebar Panel for actions / votes */}
              <div className="space-y-6">
                {project.cv_required && (
                  <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-panel">
                    <h3 className="font-display text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Company Selection Project</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      For this project, a randomized spin wheel will not be run. Your team's CVs will be shared with the host company, who will select the team to be matched.
                    </p>
                  </section>
                )}
                
                {/* Vote Action Box */}
                {project.status === 'voting' ? (
                  <section className="rounded-2xl border border-accent/25 bg-accent/5 p-6 shadow-panel">
                    <h3 className="font-display text-sm font-bold text-accent uppercase tracking-wider mb-2.5">Cast Your Vote</h3>
                    <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                      Team leaders can submit one vote per project. Votes can be withdrawn until the closing date.
                    </p>
                    <VoteButton projectId={project.id} votingOpen />
                  </section>
                ) : (
                  <section className="rounded-2xl border border-border bg-white dark:bg-[#14120B] p-6 shadow-panel text-center">
                    <h3 className="font-display text-xs font-bold text-text-muted uppercase tracking-wider">Voting Status</h3>
                    <p className="mt-2 text-sm text-text-secondary font-medium">
                      Voting is currently closed for this project.
                    </p>
                    {project.status === 'closed' && project.cv_required && role === 'admin' && (
                      <div className="mt-4">
                        <Button
                          size="sm"
                          className="w-full font-bold uppercase tracking-wider"
                          onClick={() => setAssignModalOpen(true)}
                        >
                          Assign Team
                        </Button>
                      </div>
                    )}
                  </section>
                )}

                {/* Assigned Results box */}
                {winningTeam && (
                  <section className="rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center shadow-panel">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted">Selected Winning Team</p>
                    <p className="mt-2 font-display text-2xl font-extrabold text-accent-hover tracking-tight">{winningTeam}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-0.5 text-[10px] font-semibold text-blue-500 border border-blue-500/20">
                      🔒 Confirmed & Locked
                    </div>
                  </section>
                )}

              </div>
            </div>
          )}

          {/* Tab 2: Voter List Grid */}
          {activeTab === 'voters' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide">
                  Voter Distribution List
                </h3>
                <span className="text-xs text-text-muted font-medium">
                  Showing {votes.length} team votes
                </span>
              </div>
              <VoterList projectId={project.id} visible />
            </section>
          )}

          {/* Tab 3: Spin Wheel Details */}
          {activeTab === 'spin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Event detail */}
              <div className="lg:col-span-2 flex flex-col">
                <section className="rounded-2xl border border-border bg-white dark:bg-[#14120B] p-6 sm:p-8 shadow-panel flex-1">
                  <h2 className="mb-4 font-display text-md font-bold text-text-primary uppercase tracking-wide">
                    Live Allocation Event
                  </h2>
                  
                  {!spinLoading && spinEvent?.scheduled_at ? (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-border bg-bg-base/30 dark:bg-bg-base/20 space-y-3.5">
                        <div>
                          <p className="text-[11px] font-display font-bold text-text-muted uppercase tracking-wider">Scheduled Broadcast</p>
                          <p className="mt-1 font-mono text-sm font-semibold text-text-primary">
                            {formatDateTime(spinEvent.scheduled_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                          <span className="text-xs text-text-secondary font-medium">T-Minus Countdown:</span>
                          <Countdown deadline={spinEvent.scheduled_at} className="font-mono font-bold text-amber-500" />
                        </div>
                      </div>

                      {spinEvent.zoom_link && (
                        <a
                          href={spinEvent.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent text-black font-display font-bold uppercase tracking-wider text-xs px-6 transition-all duration-200 hover:bg-accent-hover shadow-[0_4px_12px_var(--accent-glow)] cursor-pointer"
                        >
                          Join Zoom Broadcast
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-text-secondary leading-relaxed">
                      {winningTeam ? (
                        <p>The allocation spin event has completed successfully. The project was allocated to <span className="font-bold text-accent">{winningTeam}</span>.</p>
                      ) : (
                        <p>No spin allocation events have been scheduled by course coordinators yet. Once scheduled, Zoom details and countdowns will appear here.</p>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Candidates sidebar list */}
              <div className="flex flex-col">
                <section className="rounded-2xl border border-border bg-white dark:bg-[#14120B] p-6 shadow-panel flex-1 flex flex-col">
                  <h3 className="mb-4 font-display text-sm font-bold text-text-primary uppercase tracking-wide">
                    Wheel Candidates
                  </h3>
                  {candidates.length > 0 ? (
                    <ul className="space-y-3.5 text-xs text-text-secondary">
                      {candidates.map((t) => (
                        <li key={t.id} className="flex items-center justify-between border-b border-border/30 pb-2">
                          <span className="font-semibold text-text-primary truncate">{t.name}</span>
                          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted leading-relaxed">
                      No eligible candidate teams verified for the spin event yet. Teams must vote and upload CVs to appear here.
                    </p>
                  )}
                </section>
              </div>

            </div>
          )}

        </div>

      </div>

      {project.cv_required && (
        <AssignTeamModal
          projectId={project.id}
          projectTitle={project.title}
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={async () => {
            await Promise.all([refetchProject(), refetchSpin()])
          }}
        />
      )}
    </PageWrapper>
  )
}
