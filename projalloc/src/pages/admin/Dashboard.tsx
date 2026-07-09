import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useDashboardStats } from '@/hooks/useSpinEvent'
import { useSettings } from '@/hooks/useSettings'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { getErrorMessage } from '@/lib/utils'

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

      <CvSettingsPanel />
    </PageWrapper>
  )
}

function CvSettingsPanel() {
  const { settings, loading, error, updateSettings } = useSettings()
  const [start, setStart] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      const formatToLocalValue = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const offset = date.getTimezoneOffset()
        const local = new Date(date.getTime() - offset * 60_000)
        return local.toISOString().slice(0, 16)
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStart(formatToLocalValue(settings.cv_upload_start))
      setDeadline(formatToLocalValue(settings.cv_upload_deadline))
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    setSuccess(null)

    if (!start || !deadline) {
      setFormError('Please select both start and deadline date-times.')
      setSaving(false)
      return
    }

    if (new Date(deadline) <= new Date(start)) {
      setFormError('The submission deadline must be after the upload start time.')
      setSaving(false)
      return
    }

    try {
      await updateSettings(
        new Date(start).toISOString(),
        new Date(deadline).toISOString()
      )
      setSuccess('Timeline settings updated successfully.')
    } catch (err: unknown) {
      setFormError(getErrorMessage(err) || 'Failed to update settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 mt-8 flex justify-center items-center">
        <Spinner />
      </Card>
    )
  }

  return (
    <Card className="p-6 mt-8 border border-border/80 bg-bg-surface/30 backdrop-blur-md rounded-2xl shadow-panel">
      <div className="border-b border-border/40 pb-4 mb-4">
        <h3 className="font-display text-lg font-bold text-text-primary">CV Upload Timeline Settings</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure the active window during which teams are allowed to upload their ZIP archives.
        </p>
      </div>

      {formError && <div className="mb-4"><Alert message={formError} /></div>}
      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && (
        <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs font-medium text-accent">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Upload Start Time</label>
            <DateTimePicker value={start} onChange={setStart} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Upload Deadline</label>
            <DateTimePicker value={deadline} onChange={setDeadline} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving settings...' : 'Save Timeline'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
