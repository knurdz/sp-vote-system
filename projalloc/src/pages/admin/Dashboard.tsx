import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useDashboardStats } from '@/hooks/useSpinEvent'

export function Dashboard() {
  const { stats, loading } = useDashboardStats()

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary">Manage projects, teams, and spin events</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-4 gap-6">
          <Card>
            <p className="text-sm text-text-secondary">Total Projects</p>
            <p className="text-3xl font-bold text-text-primary">{stats.totalProjects}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Open Votes</p>
            <p className="text-3xl font-bold text-green">{stats.openVotes}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Upcoming Spins</p>
            <p className="text-3xl font-bold text-yellow">{stats.upcomingSpins}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Assigned</p>
            <p className="text-3xl font-bold text-accent-hover">{stats.assigned}</p>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/admin/projects">
          <Button>Manage Projects</Button>
        </Link>
        <Link to="/admin/teams">
          <Button variant="secondary">Manage Teams</Button>
        </Link>
      </div>
    </PageWrapper>
  )
}
