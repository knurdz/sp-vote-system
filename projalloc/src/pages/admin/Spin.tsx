import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { SpinWheel } from '@/components/spin/SpinWheel'
import { SpinResult } from '@/components/spin/SpinResult'
import { useProject } from '@/hooks/useProjects'
import { useSpinEvent } from '@/hooks/useSpinEvent'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime, fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/utils'

export function AdminSpin() {
  const { projectId } = useParams<{ projectId: string }>()
  const { project, loading: projectLoading } = useProject(projectId)
  const { spinEvent, spinLog, candidates, loading, error, isLocked, refetch } =
    useSpinEvent(projectId)
  const { profile, user } = useAuth()

  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [locking, setLocking] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)

  const [zoomLink, setZoomLink] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const handleSchedule = async () => {
    if (!projectId) return
    setScheduling(true)
    setScheduleError(null)

    const payload = {
      project_id: projectId,
      zoom_link: zoomLink || null,
      scheduled_at: scheduledAt ? fromDatetimeLocalValue(scheduledAt) : null,
    }

    const { error: err } = spinEvent
      ? await supabase.from('spin_events').update(payload).eq('id', spinEvent.id)
      : await supabase.from('spin_events').insert(payload)

    setScheduling(false)
    if (err) {
      setScheduleError(err.message)
      return
    }
    await refetch()
  }

  const handleLock = async () => {
    if (!winner || !project || !projectId) {
      setLockError('Missing spin result. Please spin again.')
      return
    }

    const triggeredBy = profile?.id ?? user?.id
    if (!triggeredBy) {
      setLockError('You must be signed in to lock results.')
      return
    }

    setLocking(true)
    setLockError(null)

    let eventId = spinEvent?.id

    if (!eventId) {
      const { data: created, error: createErr } = await supabase
        .from('spin_events')
        .insert({
          project_id: projectId,
          zoom_link: zoomLink || spinEvent?.zoom_link || null,
          scheduled_at: scheduledAt
            ? fromDatetimeLocalValue(scheduledAt)
            : spinEvent?.scheduled_at ?? null,
        })
        .select('id')
        .single()

      if (createErr || !created) {
        setLockError(createErr?.message ?? 'Failed to create spin event.')
        setLocking(false)
        return
      }
      eventId = created.id
    }

    const allCandidates = candidates.map((t) => ({
      team_id: t.id,
      team_name: t.name,
    }))

    const { error: logErr } = await supabase.from('spin_logs').insert({
      spin_event_id: eventId,
      all_candidates: allCandidates,
      winning_team_name: winner.name,
      project_title: project.title,
      company: project.company,
    })

    if (logErr) {
      setLockError(logErr.message)
      setLocking(false)
      return
    }

    const { error: eventErr } = await supabase
      .from('spin_events')
      .update({
        spun_at: new Date().toISOString(),
        winning_team_id: winner.id,
        triggered_by: triggeredBy,
      })
      .eq('id', eventId)

    if (eventErr) {
      setLockError(eventErr.message)
      setLocking(false)
      return
    }

    const { error: projectErr } = await supabase
      .from('projects')
      .update({ status: 'assigned' })
      .eq('id', project.id)

    if (projectErr) {
      setLockError(projectErr.message)
      setLocking(false)
      return
    }

    await supabase
      .from('votes')
      .delete()
      .eq('team_id', winner.id)
      .neq('project_id', project.id)

    setLocking(false)

    setShowResult(false)
    setWinner(null)
    await refetch()
  }

  const copyZoomLink = () => {
    if (spinEvent?.zoom_link) {
      void navigator.clipboard.writeText(spinEvent.zoom_link)
    }
  }

  const inputClass = 'input-field input-field-focus'

  if (projectLoading || loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </PageWrapper>
    )
  }

  if (!project) {
    return (
      <PageWrapper>
        <Alert message="Project not found" />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="max-w-5xl">
      <Link to="/admin/projects" className="text-sm text-text-secondary hover:text-text-primary">
        ← Back to projects
      </Link>

      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold">{project.title}</h1>
        <p className="mt-2 text-xl text-text-secondary">{project.company}</p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {lockError && (
        <div className="mb-4">
          <Alert message={lockError} />
        </div>
      )}

      {/* Schedule section */}
      <div className="mb-8 panel p-6">
        {spinEvent?.zoom_link && (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-text-secondary">Zoom:</span>
            <a
              href={spinEvent.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-hover hover:underline"
            >
              {spinEvent.zoom_link}
            </a>
            <Button size="sm" variant="secondary" onClick={copyZoomLink}>
              Copy
            </Button>
          </div>
        )}

        {spinEvent?.scheduled_at && (
          <p className="mb-4 text-sm text-text-secondary">
            Scheduled: {formatDateTime(spinEvent.scheduled_at)}
          </p>
        )}

        {!isLocked && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Zoom Link</label>
              <input
                className={inputClass}
                value={zoomLink || spinEvent?.zoom_link || ''}
                onChange={(e) => setZoomLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <DateTimePicker
              compact
              label="Scheduled At"
              value={
                scheduledAt ||
                (spinEvent?.scheduled_at
                  ? toDatetimeLocalValue(spinEvent.scheduled_at)
                  : '')
              }
              onChange={setScheduledAt}
            />
            <div>
              {scheduleError && <Alert message={scheduleError} />}
              <Button onClick={() => void handleSchedule()} disabled={scheduling}>
                {scheduling ? 'Saving…' : spinEvent ? 'Update Schedule' : 'Schedule Event'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates */}
      <div className="mb-8 panel p-6">
        <h2 className="mb-3 font-semibold">Teams on the Wheel ({candidates.length})</h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-text-secondary">No teams have voted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {candidates.map((t) => (
              <span
                key={t.id}
                className="rounded border border-border px-3 py-1 text-sm"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Wheel */}
      {isLocked && spinLog ? (
        <div className="rounded-card border border-accent/30 bg-accent-glow py-16 text-center">
          <div className="mb-4 text-6xl">🏆</div>
          <p className="text-sm text-text-secondary">Result Locked</p>
          <p className="text-4xl font-bold text-accent-hover">{spinLog.winning_team_name}</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <SpinWheel
            candidates={candidates.map((t) => ({ id: t.id, name: t.name }))}
            disabled={isLocked}
            onSpinComplete={(w) => {
              setWinner(w)
              setLockError(null)
              setShowResult(true)
            }}
          />
        </div>
      )}

      <SpinResult
        open={showResult}
        winnerName={winner?.name ?? ''}
        onConfirm={() => void handleLock()}
        onCancel={() => {
          setShowResult(false)
          setLockError(null)
        }}
        loading={locking}
        error={lockError}
      />
    </PageWrapper>
  )
}
