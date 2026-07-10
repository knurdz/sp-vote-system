import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SpinModal } from '@/components/spin/SpinModal'
import { useProject } from '@/hooks/useProjects'

export function AdminSpin() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { project, loading, error } = useProject(projectId)

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

  if (project.cv_required) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto mt-8 text-center space-y-4">
          <Alert message="Spin wheel disabled: This project requires manual CV selection by the company." />
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/projects')}>
            Return to Projects
          </Button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <SpinModal
      project={project}
      open
      onClose={() => navigate('/admin/projects')}
      onLocked={() => navigate('/admin/projects')}
    />
  )
}
