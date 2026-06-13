import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePolling } from '@/hooks/usePolling'
import type { VoteWithTeam } from '@/types'

export function useVotes(projectId: string | undefined) {
  const [votes, setVotes] = useState<VoteWithTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVotes = useCallback(async () => {
    if (!projectId) return

    const { data, error: err } = await supabase
      .from('votes')
      .select('*, team:teams(*)')
      .eq('project_id', projectId)
      .order('voted_at', { ascending: true })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setVotes((data ?? []) as VoteWithTeam[])
    setError(null)
    setLoading(false)
  }, [projectId])

  usePolling(fetchVotes, [projectId])

  return { votes, loading, error, refetch: fetchVotes }
}
