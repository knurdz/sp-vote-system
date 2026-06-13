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

export function useVote(projectId: string | undefined) {
  const { user, role } = useAuth()
  const [hasVoted, setHasVoted] = useState(false)
  const [voteId, setVoteId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<TeamAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVoteState = useCallback(async () => {
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
  }, [projectId, user?.email, role])

  usePolling(fetchVoteState, [projectId, user?.email, role])

  const vote = useCallback(async () => {
    if (!projectId || !user?.email || !teamId || assignment) return
    setActionLoading(true)
    setError(null)

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
    if (!voteId) return
    setActionLoading(true)
    setError(null)

    const { error: err } = await supabase.from('votes').delete().eq('id', voteId)

    setActionLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    await fetchVoteState()
  }, [voteId, fetchVoteState])

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
