import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
import { sortProjectsByStatus, STATUS_LABELS } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Project } from '@/types'

export function AdminProjects() {
  const { projects, loading, error, refetch } = useProjects()
  const sortedProjects = useMemo(() => sortProjectsByStatus(projects), [projects])
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
          <Link to="/admin" className="inline-flex items-center gap-1 font-display text-sm font-semibold text-text-secondary hover:text-accent transition-colors">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">Manage Projects</h1>
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
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-md py-16 text-center shadow-panel">
          <p className="font-display font-bold text-text-primary text-[17px]">No projects yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Click Add Project to create the first project for team allocation.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-md shadow-panel">
          <table className="w-full min-w-[700px] text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/40">
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">Title</th>
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">Company</th>
                <th className="px-5 py-4 font-display font-semibold text-[13px] uppercase tracking-wider text-text-muted">Status</th>
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
              {sortedProjects.map((project) => (
                <motion.tr
                  key={project.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 24 } },
                  }}
                  className="border-b border-border/60 bg-transparent hover:bg-bg-elevated/20 transition-colors"
                >
                  <td className="px-5 py-4 font-semibold text-text-primary">{project.title}</td>
                  <td className="px-5 py-4 text-text-secondary">{project.company}</td>
                  <td className="px-5 py-4">
                    <Badge variant={project.status}>{STATUS_LABELS[project.status]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {project.status !== 'assigned' && (
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
                      )}
                      {project.status === 'closed' && (
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
                </motion.tr>
              ))}
            </motion.tbody>
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
