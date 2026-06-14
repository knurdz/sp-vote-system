import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { ProjectForm, type ProjectFormData } from '@/components/projects/ProjectForm'
import { SpinModal } from '@/components/spin/SpinModal'
import { useProjects } from '@/hooks/useProjects'
import { projectHasVotes } from '@/hooks/useTeams'
import { supabase } from '@/lib/supabase'
import { STATUS_LABELS } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Project } from '@/types'

export function AdminProjects() {
  const { projects, loading, error, refetch } = useProjects()
  const { profile } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [spinProject, setSpinProject] = useState<Project | null>(null)

  const handleSave = async (data: ProjectFormData) => {
    if (editing) {
      const { error: err } = await supabase
        .from('projects')
        .update(data)
        .eq('id', editing.id)
      if (err) throw new Error(err.message)
    } else {
      const { error: err } = await supabase.from('projects').insert({
        ...data,
        created_by: profile?.id,
      })
      if (err) throw new Error(err.message)
    }
    setModalOpen(false)
    setEditing(null)
    await refetch()
  }

  const handleDelete = async (project: Project) => {
    setDeleteError(null)

    const hasVotes = await projectHasVotes(project.id)
    const hasRelatedData =
      hasVotes || project.status === 'closed' || project.status === 'assigned'

    const message = hasRelatedData
      ? `Delete "${project.title}" and all votes/spin history? This cannot be undone.`
      : `Delete "${project.title}"?`

    if (!confirm(message)) return

    const { error: err } = await supabase.rpc('admin_delete_project', {
      p_project_id: project.id,
    })

    if (err) {
      setDeleteError(err.message)
      return
    }
    await refetch()
  }

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin" className="text-sm text-text-secondary hover:text-text-primary">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Manage Projects</h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Add Project
        </Button>
      </div>

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
                <th className="px-4 py-3 font-medium text-text-secondary">Title</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Company</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border bg-bg-base">
                  <td className="px-4 py-3">{project.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{project.company}</td>
                  <td className="px-4 py-3">
                    <Badge variant={project.status}>{STATUS_LABELS[project.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(project)
                          setModalOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                      {(project.status === 'closed' || project.status === 'assigned') && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSpinProject(project)}
                        >
                          Spin
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDelete(project)}
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
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Project' : 'Add Project'}
        size="xl"
      >
        <ProjectForm
          initial={editing ?? undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      </Modal>

      <SpinModal
        project={spinProject}
        open={!!spinProject}
        onClose={() => setSpinProject(null)}
        onLocked={() => {
          setSpinProject(null)
          void refetch()
        }}
      />
    </PageWrapper>
  )
}
