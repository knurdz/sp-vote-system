import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePolling } from '@/hooks/usePolling'
import { useSubmitLock } from '@/hooks/useSubmitLock'

interface TeamAssignment {
  projectId: string
  projectTitle: string
}

async function fetchTeamAssignment(teamId: string): Promise<TeamAssignment | null> {
  const { data, error } = await supabase
    .from('spin_events')
    .select('project_id, projects(title, status)')
    .eq('winning_team_id', teamId)
    .not('spun_at', 'is', null)

  if (error || !data?.length) return null

  for (const row of data) {
    const raw = row.projects as { title: string; status: string } | { title: string; status: string }[] | null
    const project = Array.isArray(raw) ? raw[0] : raw
    if (project?.status === 'assigned') {
      return { projectId: row.project_id, projectTitle: project.title }
    }
  }

  return null
}

async function isProjectVotingOpen(projectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single()

  if (error || !data) return false
  return data.status === 'voting'
}

async function teamHasVoteOnProject(projectId: string, teamId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('team_id', teamId)

  if (error) return true
  return (count ?? 0) > 0
}

export function useVote(projectId: string | undefined) {
  const { user, role, loading: authLoading } = useAuth()
  const userEmail = user?.email
  const [hasVoted, setHasVoted] = useState(false)
  const [voteId, setVoteId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [cvUploaded, setCvUploaded] = useState(false)
  const [cvUploadDeadline, setCvUploadDeadline] = useState<string>('')
  const [uploadDeadlinePassed, setUploadDeadlinePassed] = useState(false)
  const [assignment, setAssignment] = useState<TeamAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { runLocked } = useSubmitLock()

  const fetchVoteState = useCallback(async () => {
    if (authLoading) return

    if (!projectId || !userEmail || role !== 'leader') {
      setLoading(false)
      return
    }

    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, cv_url')
      .eq('leader_email', userEmail)
      .single()

    if (teamErr || !team) {
      setLoading(false)
      return
    }

    setTeamId(team.id)
    setCvUploaded(!!team.cv_url)

    const { data: settings } = await supabase
      .from('settings')
      .select('cv_upload_deadline')
      .eq('id', 1)
      .single()

    if (settings) {
      setCvUploadDeadline(settings.cv_upload_deadline)
      setUploadDeadlinePassed(new Date() > new Date(settings.cv_upload_deadline))
    }

    const assigned = await fetchTeamAssignment(team.id)
    setAssignment(assigned)

    const { data: vote, error: voteErr } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('team_id', team.id)
      .maybeSingle()

    if (voteErr) {
      setError(voteErr.message)
      setLoading(false)
      return
    }

    setHasVoted(!!vote)
    setVoteId(vote?.id ?? null)
    setLoading(false)
  }, [projectId, userEmail, role, authLoading])

  usePolling(fetchVoteState, [projectId, userEmail, role, authLoading])

  const vote = useCallback(async () => {
    await runLocked(async () => {
      if (!projectId || !userEmail || !teamId || assignment) return
      setActionLoading(true)
      setError(null)

      // Check CV and settings state at action time
      const { data: teamCheck } = await supabase
        .from('teams')
        .select('cv_url')
        .eq('id', teamId)
        .single()

      if (!teamCheck?.cv_url) {
        setError('Your team must upload a CV ZIP file before you can vote.')
        setActionLoading(false)
        return
      }

      const { data: settings } = await supabase
        .from('settings')
        .select('cv_upload_deadline')
        .eq('id', 1)
        .single()

      if (settings && new Date() <= new Date(settings.cv_upload_deadline)) {
        setError('Voting is locked until the CV upload period closes.')
        setActionLoading(false)
        return
      }

      const votingOpen = await isProjectVotingOpen(projectId)
      if (!votingOpen) {
        setError('Voting has closed on this project.')
        setActionLoading(false)
        return
      }

      const alreadyVoted = await teamHasVoteOnProject(projectId, teamId)
      if (alreadyVoted) {
        setError('Your team already voted on this one.')
        setActionLoading(false)
        await fetchVoteState()
        return
      }

      const { error: err } = await supabase.from('votes').insert({
        project_id: projectId,
        team_id: teamId,
        leader_email: userEmail,
      })

      setActionLoading(false)
      if (err) {
        setError(err.message)
        return
      }
      await fetchVoteState()
    })
  }, [projectId, userEmail, teamId, assignment, fetchVoteState, runLocked])

  const withdraw = useCallback(async () => {
    await runLocked(async () => {
      if (!voteId || !projectId) return
      setActionLoading(true)
      setError(null)

      const votingOpen = await isProjectVotingOpen(projectId)
      if (!votingOpen) {
        setError('Voting is closed — you can’t pull your vote back now.')
        setActionLoading(false)
        return
      }

      const { error: err } = await supabase.from('votes').delete().eq('id', voteId)

      setActionLoading(false)
      if (err) {
        setError(err.message)
        return
      }
      await fetchVoteState()
    })
  }, [voteId, projectId, fetchVoteState, runLocked])

  const assignedElsewhere =
    assignment !== null && assignment.projectId !== projectId

  return {
    hasVoted,
    loading,
    actionLoading,
    error,
    assignment,
    assignedElsewhere,
    cvUploaded,
    cvUploadDeadline,
    uploadDeadlinePassed,
    role,
    canVote: role === 'leader' && !!teamId && !assignedElsewhere && cvUploaded && uploadDeadlinePassed,
    vote,
    withdraw,
  }
}
