import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { useSpinLogs } from '@/hooks/useSpinEvent'

export function Results() {
  const { logs, loading, error } = useSpinLogs()

  return (
    <PageWrapper>
      <div className="relative z-10 space-y-6">
        
        {/* Page Title Header */}
        <div className="flex flex-col gap-1.5 border-b border-border/40 pb-4">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl uppercase">
            Results Archive
          </h1>
          <p className="text-xs text-text-secondary">
            View completed allocation spin results and candidate distributions.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {error && <Alert message={error} />}

        {!loading && !error && logs.length === 0 && (
          <div className="rounded-2xl border border-border bg-white dark:bg-[#14120B] py-16 text-center shadow-panel">
            <svg className="mx-auto mb-4 h-12 w-12 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-display font-bold text-text-primary text-[15px] uppercase tracking-wide">No Results Recorded</p>
            <p className="mx-auto mt-2 max-w-md text-xs text-text-secondary">
              Once spin allocations are finalized and locked by course coordinators, they will be registered here.
            </p>
          </div>
        )}

        {/* Results Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log) => (
            <article
              key={log.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-white dark:bg-[#14120B] p-5 shadow-panel transition-all duration-200 hover:shadow-lg hover:border-accent/25"
            >
              <div className="space-y-4">
                
                {/* Header Row */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-sm font-bold text-text-primary uppercase tracking-tight">
                      {log.project_title}
                    </h2>
                    <p className="text-[11px] font-mono text-text-secondary mt-0.5">{log.company}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono text-text-muted">
                    {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Allocated Team Indicator Box */}
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-center">
                  <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    ALLOCATED WINNER
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-accent-hover tracking-tight truncate uppercase">
                    {log.winning_team_name}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    🔒 Confirmed & Audited
                  </div>
                </div>

                {/* Candidate tags */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    Candidates on the Wheel
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {log.all_candidates.map((c) => {
                      const isWinner = c.team_name === log.winning_team_name
                      return (
                        <span
                          key={c.team_id}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
                            isWinner
                              ? 'border-accent bg-accent/15 text-accent shadow-[0_0_6px_var(--accent-glow)]'
                              : 'border-border/60 bg-bg-base/40 text-text-secondary'
                          }`}
                        >
                          {c.team_name}
                        </span>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Footer Timestamp */}
              <div className="mt-5 pt-3 border-t border-border/30 text-right">
                <span className="font-mono text-[9px] text-text-muted">
                  Recorded at: {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

            </article>
          ))}
        </div>

      </div>
    </PageWrapper>
  )
}
