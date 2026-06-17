import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useDashboardStats } from '@/hooks/useSpinEvent'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 22 },
  },
} as const

export function Dashboard() {
  const { stats, loading } = useDashboardStats()

  return (
    <PageWrapper>
      <div className="page-header mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-1.5 text-text-secondary">Manage projects, teams, and spin events</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card className="hover:border-border">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Projects</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-text-primary tracking-tight">{stats.totalProjects}</p>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:border-border">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">Open for votes</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-accent tracking-tight">{stats.openVotes}</p>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:border-border">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">Upcoming Spins</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-yellow tracking-tight">{stats.upcomingSpins}</p>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="hover:border-border">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">Assigned Rounds</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-accent-hover tracking-tight">{stats.assigned}</p>
            </Card>
          </motion.div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-4">
        <Link to="/admin/projects" className="flex-1 sm:flex-none">
          <Button size="lg" className="w-full sm:w-auto">Manage Projects</Button>
        </Link>
        <Link to="/admin/teams" className="flex-1 sm:flex-none">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto">
            Manage Teams
          </Button>
        </Link>
      </div>
    </PageWrapper>
  )
}
