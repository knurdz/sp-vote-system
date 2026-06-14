import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePolling } from '@/hooks/usePolling'
import type { Team } from '@/types'

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setTeams((data ?? []) as Team[])
    setError(null)
    setLoading(false)
  }, [])

  usePolling(fetchTeams, [])

  return { teams, loading, error, refetch: fetchTeams }
}

export async function teamHasVotes(teamId: string) {
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)
  return (count ?? 0) > 0
}

export async function projectHasVotes(projectId: string) {
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
  return (count ?? 0) > 0
}
