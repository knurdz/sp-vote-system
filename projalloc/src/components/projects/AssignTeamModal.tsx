import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/types'

interface AssignTeamModalProps {
  projectId: string
  projectTitle: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CandidateVote {
  id: string
  team_id: string
  voted_at: string
  team: Team | null
}

export function AssignTeamModal({
  projectId,
  projectTitle,
  open,
  onClose,
  onSuccess,
}: AssignTeamModalProps) {
  const [candidates, setCandidates] = useState<CandidateVote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !projectId) return

    const loadCandidates = async () => {
      setLoading(true)
      setError(null)
      setSelectedTeamId('')
      try {
        const { data, error: fetchErr } = await supabase
          .from('votes')
          .select('id, team_id, voted_at, team:teams(id, name, leader_email, cv_url)')
          .eq('project_id', projectId)

        if (fetchErr) throw fetchErr
        
        // Filter out votes where the team record is null (just in case of DB orphaned rows)
        const validCandidates = (data || []).filter((v) => v.team !== null) as CandidateVote[]
        setCandidates(validCandidates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidates')
      } finally {
        setLoading(false)
      }
    }

    void loadCandidates()
  }, [open, projectId])

  const handleAssign = async () => {
    if (!selectedTeamId || !projectId) return
    setSubmitting(true)
    setError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('assign_project_manually', {
        p_project_id: projectId,
        p_team_id: selectedTeamId,
      })

      if (rpcErr) throw rpcErr

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign project')
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
        Cancel
      </Button>
      <Button
        type="button"
        onClick={() => void handleAssign()}
        disabled={!selectedTeamId || submitting}
      >
        {submitting ? 'Assigning…' : 'Confirm Assignment'}
      </Button>
    </>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Manual Team Assignment: ${projectTitle}`}
      footer={footer}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-text-secondary">
          This is a **CV Required** project. The host company will review candidate CVs and select a team.
          Choose the company's selected team below to finalize the assignment. This will lock the project and discard the team's votes on other projects.
        </p>

        {error && <Alert message={error} />}

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-bg-base/35 p-6 text-center">
            <p className="font-semibold text-text-primary text-sm">No Candidate Votes Yet</p>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              No teams have voted for this project. At least one team must vote for the project before you can assign it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Select Winning Team</p>
            <div className="divide-y divide-border/40 rounded-xl border border-border/80 bg-white dark:bg-bg-elevated/20 overflow-hidden max-h-60 overflow-y-auto">
              {candidates.map(({ team }) => {
                if (!team) return null
                const isSelected = selectedTeamId === team.id
                const hasCv = !!team.cv_url

                return (
                  <label
                    key={team.id}
                    className={`flex items-center justify-between p-3.5 hover:bg-bg-base/40 transition-colors cursor-pointer select-none ${
                      isSelected ? 'bg-accent/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="winning_team"
                        className="h-4 w-4 text-accent border-border focus:ring-accent cursor-pointer"
                        checked={isSelected}
                        onChange={() => setSelectedTeamId(team.id)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary uppercase tracking-tight truncate">
                          {team.name}
                        </p>
                        <p className="text-[10px] font-mono text-text-muted truncate mt-0.5">
                          {team.leader_email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                        hasCv
                          ? 'bg-blue-500/12 border-blue-500/20 text-blue-500'
                          : 'bg-rose-500/12 border-rose-500/20 text-rose-500'
                      }`}
                    >
                      {hasCv ? 'CV Uploaded' : 'No CV'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
