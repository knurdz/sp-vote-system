import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { SpinWheel } from '@/components/spin/SpinWheel'
import { SpinResult } from '@/components/spin/SpinResult'
import { useSpinEvent } from '@/hooks/useSpinEvent'
import { useSubmitLock } from '@/hooks/useSubmitLock'
import { supabase } from '@/lib/supabase'
import { formatDateTime, fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/utils'
import { formatZodErrors, spinScheduleSchema } from '@/lib/validations'
import type { Project } from '@/types'

interface LockSpinResult {
  winning_team_id: string
  winning_team_name: string
}

interface SpinModalProps {
  project: Project | null
  open: boolean
  onClose: () => void
  onLocked?: () => void
}

function useSpinWheelSize(active: boolean) {
  const [wheelSize, setWheelSize] = useState(300)

  useEffect(() => {
    if (!active) return

    const update = () => {
      const reserved = 200
      const byHeight = window.innerHeight * 0.92 - reserved
      const byWidth = Math.min(window.innerWidth, 440) - 48
      const maxWheel = Math.min(320, byHeight, byWidth)
      setWheelSize(Math.max(260, Math.floor(maxWheel)))
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active])

  return wheelSize
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function SpinModal({ project, open, onClose, onLocked }: SpinModalProps) {
  const projectId = project?.id
  const { spinEvent, spinLog, candidates, loading, error, isLocked, refetch } =
    useSpinEvent(open ? projectId : undefined)

  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [locking, setLocking] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const [zoomLink, setZoomLink] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const { submitLocked: scheduleSubmitLocked, runLocked: runScheduleLocked } = useSubmitLock()

  const wheelSize = useSpinWheelSize(open && !!project)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showResult && !scheduleOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, showResult, scheduleOpen])

  useEffect(() => {
    if (open) return

    const resetTimer = window.setTimeout(() => {
      setWinner(null)
      setShowResult(false)
      setLockError(null)
      setScheduleError(null)
      setScheduleOpen(false)
      setZoomLink('')
      setScheduledAt('')
    }, 0)

    return () => window.clearTimeout(resetTimer)
  }, [open, projectId])

  const handleSchedule = async () => {
    if (!projectId) return
    await runScheduleLocked(async () => {
      setScheduling(true)
      setScheduleError(null)

      const resolvedZoom = (zoomLink || spinEvent?.zoom_link || '').trim()
      const resolvedSchedule =
        scheduledAt ||
        (spinEvent?.scheduled_at ? toDatetimeLocalValue(spinEvent.scheduled_at) : '')

      const parsed = spinScheduleSchema.safeParse({
        zoom_link: resolvedZoom,
        scheduled_at: resolvedSchedule ? fromDatetimeLocalValue(resolvedSchedule) : '',
      })

      if (!parsed.success) {
        setScheduleError(formatZodErrors(parsed.error))
        setScheduling(false)
        return
      }

      const payload = {
        project_id: projectId,
        zoom_link: parsed.data.zoom_link || null,
        scheduled_at: parsed.data.scheduled_at
          ? fromDatetimeLocalValue(resolvedSchedule)
          : null,
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
      setScheduleOpen(false)
    })
  }

  const handleSpinStart = async () => {
    if (!projectId) {
      const message = 'Missing project.'
      setLockError(message)
      throw new Error(message)
    }

    setLocking(true)
    setLockError(null)

    try {
      const { data, error: lockErr } = await supabase.rpc('lock_spin_result', {
        p_project_id: projectId,
      })

      if (lockErr) {
        setLockError(lockErr.message)
        throw new Error(lockErr.message)
      }

      const result = data as LockSpinResult | null
      if (!result?.winning_team_id || !result.winning_team_name) {
        const message = 'Spin result was not returned by the server.'
        setLockError(message)
        throw new Error(message)
      }

      return {
        id: result.winning_team_id,
        name: result.winning_team_name,
      }
    } finally {
      setLocking(false)
    }
  }

  const handleSpinComplete = async (w: { id: string; name: string }) => {
    setWinner(w)
    setLockError(null)
    setShowResult(true)
    await refetch()
  }

  const handleResultDone = async () => {
    setShowResult(false)
    setWinner(null)
    await refetch()
    onLocked?.()
  }

  const copyZoomLink = () => {
    if (spinEvent?.zoom_link) {
      void navigator.clipboard.writeText(spinEvent.zoom_link)
    }
  }

  const inputClass = 'input-field input-field-focus'

  if (!open || !project) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => {
            if (!showResult && !scheduleOpen) onClose()
          }}
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="spin-overlay-card relative z-10"
          role="dialog"
          aria-modal
          aria-labelledby="spin-title"
        >
          <div className="spin-overlay-accent" />

          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 px-6 pb-3 pt-5">
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-accent">
                Team Allocation Round
              </p>
              <h2 id="spin-title" className="truncate font-display text-lg font-bold tracking-tight text-text-primary">
                {project.title}
              </h2>
              <p className="text-xs text-text-secondary">{project.company}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-all duration-200 hover:border-accent/40 hover:text-accent hover:bg-accent/5"
                  aria-label="Schedule spin event"
                  title="Schedule event"
                >
                  <CalendarIcon />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={showResult}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted transition-all duration-200 hover:border-border hover:text-text-primary hover:bg-bg-elevated/40 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-6 pb-6">
            {loading ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-3.5 w-full">
                    <Alert message={error} />
                  </div>
                )}
                {lockError && !showResult && (
                  <div className="mb-3.5 w-full">
                    <Alert message={lockError} />
                  </div>
                )}

                {/* Candidates */}
                <div className="mb-4 w-full">
                  <p className="mb-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {candidates.length} {candidates.length === 1 ? 'team' : 'teams'} on the wheel
                  </p>
                  {candidates.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {candidates.map((t) => (
                        <span key={t.id} className="spin-candidate-pill">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wheel or locked result */}
                <div className="flex flex-1 flex-col items-center justify-center">
                  {isLocked && spinLog ? (
                    <div className="w-full rounded-2xl border border-accent/20 bg-accent/8 px-6 py-12 text-center shadow-panel">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-text-muted">
                        Selection Locked
                      </p>
                      <p className="mt-1.5 text-[13px] text-text-secondary">Selected Team</p>
                      <p className="mt-2 font-display text-2xl font-extrabold text-accent-hover">
                        {spinLog.winning_team_name}
                      </p>
                    </div>
                  ) : (
                    <SpinWheel
                      size={wheelSize}
                      compact
                      candidates={candidates.map((t) => ({ id: t.id, name: t.name }))}
                      disabled={isLocked || showResult || locking}
                      onSpinStart={handleSpinStart}
                      onSpinComplete={(w) => void handleSpinComplete(w)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Schedule sub-modal */}
      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Spin Event"
        size="lg"
      >
        <div className="space-y-4">
          {spinEvent?.zoom_link && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-text-secondary">Current Zoom:</span>
              <a
                href={spinEvent.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-hover hover:underline"
              >
                {spinEvent.zoom_link}
              </a>
              <Button size="sm" variant="secondary" onClick={copyZoomLink}>
                Copy
              </Button>
            </div>
          )}

          {spinEvent?.scheduled_at && (
            <p className="text-sm text-text-secondary">
              Scheduled: {formatDateTime(spinEvent.scheduled_at)}
            </p>
          )}

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
              (spinEvent?.scheduled_at ? toDatetimeLocalValue(spinEvent.scheduled_at) : '')
            }
            onChange={setScheduledAt}
          />
          {scheduleError && <Alert message={scheduleError} />}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setScheduleOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSchedule()} disabled={scheduling || scheduleSubmitLocked}>
            {scheduling ? 'Saving…' : spinEvent ? 'Update' : 'Save'}
          </Button>
        </div>
      </Modal>

      <SpinResult
        open={showResult}
        winnerName={winner?.name ?? ''}
        onConfirm={() => void handleResultDone()}
        loading={locking}
        error={lockError}
        description="This result has been saved and the project is now assigned."
        confirmLabel="Done"
      />
    </>
  )
}
