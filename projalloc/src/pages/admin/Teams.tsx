import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { TeamCsvUpload } from '@/components/admin/TeamCsvUpload'
import { useTeams, teamHasVotes } from '@/hooks/useTeams'
import { useSubmitLock } from '@/hooks/useSubmitLock'
import { supabase } from '@/lib/supabase'
import { formatDateTime, getErrorMessage, openExternalUrl } from '@/lib/utils'
import { formatZodErrors, teamSchema } from '@/lib/validations'
import type { Team } from '@/types'

export function AdminTeams() {
  const { teams, loading, error, refetch } = useTeams()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [leaderEmail, setLeaderEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [saving, setSaving] = useState(false)
  const { submitLocked, runLocked } = useSubmitLock()

  const openCreate = () => {
    setEditing(null)
    setName('')
    setLeaderEmail('')
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (team: Team) => {
    setEditing(team)
    setName(team.name)
    setLeaderEmail(team.leader_email)
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    await runLocked(async () => {
      setSaving(true)
      setFormError(null)

      const parsed = teamSchema.safeParse({ name, leader_email: leaderEmail })
      if (!parsed.success) {
        setFormError(formatZodErrors(parsed.error))
        setSaving(false)
        return
      }

      const payload = parsed.data

      const { error: err } = editing
        ? await supabase.from('teams').update(payload).eq('id', editing.id)
        : await supabase.from('teams').insert(payload)

      setSaving(false)
      if (err) {
        setFormError(err.message)
        return
      }

      setModalOpen(false)
      await refetch()
    })
  }

  const handleDelete = async () => {
    if (!teamToDelete) return
    setDeleteError(null)

    const { error: err } = await supabase.from('teams').delete().eq('id', teamToDelete.id)
    if (err) {
      setDeleteError(err.message)
      setTeamToDelete(null)
      return
    }
    setTeamToDelete(null)
    await refetch()
  }

  const handleDeleteClick = async (team: Team) => {
    setDeleteError(null)
    const hasVotes = await teamHasVotes(team.id)
    if (hasVotes) {
      setDeleteError(`Cannot delete "${team.name}" — team has active votes.`)
      return
    }
    setTeamToDelete(team)
  }

  const handleDownloadCv = async (cvUrl: string) => {
    try {
      const { data, error: err } = await supabase.storage
        .from('cvs')
        .createSignedUrl(cvUrl, 60)

      if (err) throw err
      if (data?.signedUrl) {
        openExternalUrl(data.signedUrl)
      }
    } catch (err: unknown) {
      alert('Error generating download link: ' + getErrorMessage(err))
    }
  }

  const inputClass = 'input-field input-field-focus'

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 font-display text-sm font-semibold text-text-secondary hover:text-accent transition-colors">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">Manage Teams</h1>
        </div>
        <Button onClick={openCreate}>Add Team</Button>
      </div>

      <TeamCsvUpload teams={teams} onComplete={refetch} />

      {deleteError && (
        <div className="mb-4">
          <Alert message={deleteError} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <Alert message={error} />
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-md py-16 text-center shadow-panel">
          <p className="font-display font-bold text-text-primary text-[17px]">No teams registered yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Add teams manually or upload a CSV with team names and leader account emails.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-md shadow-panel">
          <table className="w-full min-w-[600px] text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/40">
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">Team Name</th>
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">Registered</th>
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">CV</th>
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <motion.tbody
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.04 },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {teams.map((team) => (
                <motion.tr
                  key={team.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 24 } },
                  }}
                  className="border-b border-border/60 bg-transparent hover:bg-bg-elevated/20 transition-colors"
                >
                  <td className="px-5 py-4 font-semibold text-text-primary">{team.name}</td>
                  <td className="px-5 py-4 font-mono text-[13px] text-text-secondary">
                    {formatDateTime(team.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    {team.cv_url ? (
                      <button
                        onClick={() => void handleDownloadCv(team.cv_url!)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline bg-accent/10 hover:bg-accent/15 px-2.5 py-1 rounded-lg border border-accent/20 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v4h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Download ZIP
                      </button>
                    ) : (
                      <span className="text-[11px] text-text-muted italic bg-bg-elevated/40 px-2 py-0.5 rounded border border-border/40">
                        No CV
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(team)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDeleteClick(team)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Team' : 'Add Team'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving || submitLocked}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="mb-4">
            <Alert message={formError} />
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Team Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Account Email</label>
            <input
              type="email"
              className={inputClass}
              value={leaderEmail}
              onChange={(e) => setLeaderEmail(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!teamToDelete}
        title="Delete Team"
        message={teamToDelete ? `Are you sure you want to delete team "${teamToDelete.name}"?` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setTeamToDelete(null)}
      />
    </PageWrapper>
  )
}
