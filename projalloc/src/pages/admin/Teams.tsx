import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { TeamCsvUpload } from '@/components/admin/TeamCsvUpload'
import { useTeams, teamHasVotes } from '@/hooks/useTeams'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import type { Team } from '@/types'

export function AdminTeams() {
  const { teams, loading, error, refetch } = useTeams()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [leaderEmail, setLeaderEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    setFormError(null)

    const payload = { name, leader_email: leaderEmail }

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
  }

  const handleDelete = async (team: Team) => {
    setDeleteError(null)
    const hasVotes = await teamHasVotes(team.id)
    if (hasVotes) {
      setDeleteError(`Cannot delete "${team.name}" — team has active votes.`)
      return
    }
    if (!confirm(`Delete team "${team.name}"?`)) return

    const { error: err } = await supabase.from('teams').delete().eq('id', team.id)
    if (err) {
      setDeleteError(err.message)
      return
    }
    await refetch()
  }

  const inputClass = 'input-field input-field-focus'

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin" className="text-sm text-text-secondary hover:text-text-primary">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Manage Teams</h1>
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
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium text-text-secondary">Team Name</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Leader Email</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Registered</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-border bg-bg-base">
                  <td className="px-4 py-3">{team.name}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{team.leader_email}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDateTime(team.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(team)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDelete(team)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
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
            <Button onClick={() => void handleSave()} disabled={saving}>
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
            <label className="mb-1 block text-sm text-text-secondary">Leader Gmail</label>
            <input
              type="email"
              className={inputClass}
              value={leaderEmail}
              onChange={(e) => setLeaderEmail(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
