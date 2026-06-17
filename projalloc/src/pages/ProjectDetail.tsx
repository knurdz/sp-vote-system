import { Link, useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'
import { Alert } from '@/components/ui/Alert'
import { ProjectDetailSkeleton } from '@/components/ui/Skeleton'
import { VoteButton } from '@/components/voting/VoteButton'
import { VoterList } from '@/components/voting/VoterList'
import { useProject } from '@/hooks/useProjects'
import { useSpinEvent } from '@/hooks/useSpinEvent'
import { formatDateTime, STATUS_LABELS } from '@/lib/utils'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { project, loading, error } = useProject(id)
  const { spinEvent, spinLog, candidates, loading: spinLoading } = useSpinEvent(id)

  if (loading) {
    return (
      <PageWrapper>
        <ProjectDetailSkeleton />
      </PageWrapper>
    )
  }

  if (error || !project) {
    return (
      <PageWrapper>
        <Alert message={error ?? 'Project not found'} />
      </PageWrapper>
    )
  }

  const votingClosed = project.status === 'closed' || project.status === 'assigned'
  const winningTeam = spinLog?.winning_team_name

  return (
    <PageWrapper>
      <div className="section-gap">
        <Link to="/" className="inline-flex items-center gap-1.5 font-display text-[14px] font-semibold text-text-secondary transition-colors hover:text-accent">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to projects
        </Link>
      </div>

      <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">{project.title}</h1>
          <p className="mt-1.5 text-lg font-medium text-text-secondary">{project.company}</p>
        </div>
        <div className="w-fit">
          <Badge variant={project.status} className="px-3 py-1 text-[11px]">
            {STATUS_LABELS[project.status]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="panel p-6 sm:p-8">
            <h2 className="mb-4 font-display text-lg font-bold text-text-primary">Description</h2>
            <p className="leading-relaxed text-text-secondary text-[15px]">{project.description}</p>
          </section>

          <section className="panel p-6 sm:p-8">
            <h2 className="mb-4 font-display text-lg font-bold text-text-primary">Tech Stack</h2>
            <div className="flex flex-wrap gap-2.5">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono rounded-lg border border-border bg-bg-base px-3.5 py-1 text-sm text-text-secondary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {votingClosed && (
            <section className="panel p-6 sm:p-8">
              <h2 className="mb-4 font-display text-lg font-bold text-text-primary">Voter Distribution</h2>
              <VoterList projectId={project.id} visible />
            </section>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="mb-5 font-display text-lg font-bold text-text-primary">Project Parameters</h2>
            <dl className="space-y-4 text-[14px]">
              <div className="flex justify-between border-b border-border/50 pb-3">
                <dt className="text-text-secondary">Team Size</dt>
                <dd className="font-display font-semibold text-text-primary">
                  {project.team_size} members
                </dd>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-3">
                <dt className="text-text-secondary">Voting Deadline</dt>
                <dd className="font-mono text-[13px] text-text-primary">
                  {formatDateTime(project.voting_deadline)}
                </dd>
              </div>
              {project.status === 'voting' && (
                <div className="flex justify-between items-center pt-1">
                  <dt className="text-text-secondary">Closes in</dt>
                  <dd>
                    <Countdown deadline={project.voting_deadline} className="font-mono text-accent font-bold" />
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {project.status === 'voting' && (
            <section className="rounded-2xl border border-accent/25 bg-accent/8 p-6 shadow-panel">
              <VoteButton projectId={project.id} votingOpen />
            </section>
          )}

          {!spinLoading && spinEvent?.scheduled_at && !winningTeam && (
            <section className="panel p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-text-primary">Spin Event</h2>
              <div className="rounded-xl border border-border/50 bg-bg-base/40 p-4 space-y-3">
                <p className="text-sm text-text-secondary">
                  Scheduled for: <span className="font-mono text-text-primary">{formatDateTime(spinEvent.scheduled_at)}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Remaining:</span>
                  <Countdown deadline={spinEvent.scheduled_at} className="font-mono font-bold text-yellow" />
                </div>
              </div>
              {spinEvent.zoom_link && (
                <a
                  href={spinEvent.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-accent text-black font-display font-semibold transition-all duration-200 hover:bg-accent-hover active:scale-[0.97]"
                >
                  Join Zoom Broadcast
                </a>
              )}
            </section>
          )}

          {winningTeam && (
            <section className="rounded-2xl border border-accent/20 bg-accent/8 p-6 text-center shadow-panel">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">Selected Team</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-accent-hover">{winningTeam}</p>
            </section>
          )}

          {candidates.length > 0 && !winningTeam && (
            <section className="panel p-6">
              <h2 className="mb-4 font-display text-lg font-bold text-text-primary">Wheel Candidates</h2>
              <ul className="space-y-2 text-sm text-text-secondary">
                {candidates.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/50" />
                    {t.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
