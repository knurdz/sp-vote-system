import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { useSpinLogs } from '@/hooks/useSpinEvent'
import { formatDateTime } from '@/lib/utils'

export function Results() {
  const { logs, loading, error } = useSpinLogs()

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Results Archive</h1>
        <p className="text-text-secondary">Completed spin events and winning teams</p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && <Alert message={error} />}

      {!loading && !error && logs.length === 0 && (
        <div className="panel py-16 text-center text-text-secondary">
          No results yet.
        </div>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <article key={log.id} className="panel p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{log.project_title}</h2>
                <p className="text-text-secondary">{log.company}</p>
              </div>
              <span className="font-mono text-xs text-text-muted">
                {formatDateTime(log.timestamp)}
              </span>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="text-lg font-medium text-accent-hover">
                {log.winning_team_name}
              </span>
            </div>

            <div>
              <p className="mb-2 text-sm text-text-secondary">Candidates on the wheel:</p>
              <div className="flex flex-wrap gap-2">
                {log.all_candidates.map((c) => (
                  <span
                    key={c.team_id}
                    className={`rounded border px-2 py-1 text-sm ${
                      c.team_name === log.winning_team_name
                        ? 'border-accent bg-accent-glow text-accent-hover'
                        : 'border-border text-text-secondary'
                    }`}
                  >
                    {c.team_name}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageWrapper>
  )
}
