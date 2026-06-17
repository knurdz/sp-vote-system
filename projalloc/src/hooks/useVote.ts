import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePolling } from '@/hooks/usePolling'

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
  const [hasVoted, setHasVoted] = useState(false)
  const [voteId, setVoteId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<TeamAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVoteState = useCallback(async () => {
    if (authLoading) return

    if (!projectId || !user?.email || role !== 'leader') {
      setLoading(false)
      return
    }

    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id')
      .eq('leader_email', user.email)
      .single()

    if (teamErr || !team) {
      setLoading(false)
      return
    }

    setTeamId(team.id)

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
  }, [projectId, user?.email, role, authLoading])

  usePolling(fetchVoteState, [projectId, user?.email, role, authLoading])

  const vote = useCallback(async () => {
    if (!projectId || !user?.email || !teamId || assignment) return
    setActionLoading(true)
    setError(null)

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
      leader_email: user.email,
    })

    setActionLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    await fetchVoteState()
  }, [projectId, user?.email, teamId, assignment, fetchVoteState])

  const withdraw = useCallback(async () => {
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
  }, [voteId, projectId, fetchVoteState])

  const assignedElsewhere =
    assignment !== null && assignment.projectId !== projectId

  return {
    hasVoted,
    loading,
    actionLoading,
    error,
    assignment,
    assignedElsewhere,
    canVote: role === 'leader' && !!teamId && !assignedElsewhere,
    vote,
    withdraw,
  }
}
