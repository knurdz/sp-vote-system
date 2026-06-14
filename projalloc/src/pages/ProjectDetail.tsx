import { Link, useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Countdown } from '@/components/ui/Countdown'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
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
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
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
      <div className="mb-6">
        <Link to="/" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
          ← Back to projects
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-text-primary">{project.title}</h1>
          <p className="text-lg text-text-secondary">{project.company}</p>
        </div>
        <Badge variant={project.status}>{STATUS_LABELS[project.status]}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <section className="panel p-6">
            <h2 className="mb-3 font-semibold text-text-primary">Description</h2>
            <p className="leading-relaxed text-text-secondary">{project.description}</p>
          </section>

          <section className="panel p-6">
            <h2 className="mb-3 font-semibold text-text-primary">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono rounded border border-border bg-bg-base px-3 py-1 text-sm text-text-secondary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {votingClosed && (
            <section className="panel p-6">
              <h2 className="mb-3 font-semibold text-text-primary">Teams that Voted</h2>
              <VoterList projectId={project.id} visible />
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="mb-4 font-semibold text-text-primary">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-secondary">Team Size</dt>
                <dd className="font-medium text-text-primary">{project.team_size} members</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Voting Deadline</dt>
                <dd className="font-mono font-medium text-text-primary">
                  {formatDateTime(project.voting_deadline)}
                </dd>
              </div>
              {project.status === 'voting' && (
                <div>
                  <dt className="text-text-secondary">Time Remaining</dt>
                  <dd>
                    <Countdown deadline={project.voting_deadline} />
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {project.status === 'voting' && (
            <section className="rounded-card border border-accent/30 bg-accent-glow p-6">
              <VoteButton projectId={project.id} votingOpen />
            </section>
          )}

          {!spinLoading && spinEvent?.scheduled_at && !winningTeam && (
            <section className="panel p-6">
              <h2 className="mb-3 font-semibold text-text-primary">Spin Event</h2>
              <p className="mb-2 text-sm text-text-secondary">
                Scheduled: {formatDateTime(spinEvent.scheduled_at)}
              </p>
              <Countdown deadline={spinEvent.scheduled_at} />
              {spinEvent.zoom_link && (
                <a
                  href={spinEvent.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-sm text-accent-hover transition-colors hover:underline"
                >
                  Join Zoom →
                </a>
              )}
            </section>
          )}

          {winningTeam && (
            <section className="rounded-card border border-accent/30 bg-accent-glow p-6 text-center">
              <div className="mb-2 text-4xl">🏆</div>
              <p className="text-sm text-text-secondary">Winning Team</p>
              <p className="text-xl font-bold text-accent-hover">{winningTeam}</p>
            </section>
          )}

          {candidates.length > 0 && !winningTeam && (
            <section className="panel p-6">
              <h2 className="mb-3 font-semibold text-text-primary">Wheel Candidates</h2>
              <ul className="space-y-1 text-sm text-text-secondary">
                {candidates.map((t) => (
                  <li key={t.id}>{t.name}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
