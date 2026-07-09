import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePolling } from '@/hooks/usePolling'
import { getEffectiveStatus } from '@/lib/utils'
import type { AssignedTeamInfo, Project, ProjectStatus } from '@/types'

async function fetchAssignedTeams(
  projects: Project[],
): Promise<Record<string, AssignedTeamInfo>> {
  const assignedIds = projects.filter((p) => p.status === 'assigned').map((p) => p.id)
  if (assignedIds.length === 0) return {}

  const { data, error } = await supabase
    .from('spin_events')
    .select('project_id, spin_logs(winning_team_name), teams(leader_email)')
    .in('project_id', assignedIds)
    .not('spun_at', 'is', null)

  if (error || !data) return {}

  const map: Record<string, AssignedTeamInfo> = {}
  for (const row of data) {
    const logs = row.spin_logs as { winning_team_name: string } | { winning_team_name: string }[] | null
    const log = Array.isArray(logs) ? logs[0] : logs
    const teamRaw = row.teams as { leader_email: string } | { leader_email: string }[] | null
    const team = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw
    if (log?.winning_team_name && row.project_id) {
      map[row.project_id] = {
        name: log.winning_team_name,
        leaderEmail: team?.leader_email ?? '',
      }
    }
  }
  return map
}

interface DummyProjectsModule {
  dummyProjects?: Project[]
}

// Load local dummy projects in dev only. The file is gitignored and must never
// be pulled into production bundles.
const dummyProjects: Project[] = []

if (import.meta.env.DEV) {
  const localDummyFiles = import.meta.glob<DummyProjectsModule>(
    '../local-dummy-projects.*',
    { eager: true },
  )

  Object.values(localDummyFiles).forEach((mod) => {
    if (Array.isArray(mod.dummyProjects)) {
      dummyProjects.push(...mod.dummyProjects)
    }
  })
}

export function useProjects(filter?: ProjectStatus | 'all') {
  const [projects, setProjects] = useState<Project[]>([])
  const [assignedTeams, setAssignedTeams] = useState<Record<string, AssignedTeamInfo>>({})
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    // Attempt to fetch project vote counts using security definer RPC (works for anon users)
    const [{ data, error: err }, rpcResult] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.rpc('get_project_vote_counts'),
    ])

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const normalized = (data as Project[]).map((p) => ({
      ...p,
      status: getEffectiveStatus(p),
    }))

    const allMerged = [...normalized, ...dummyProjects]

    const filtered =
      filter && filter !== 'all'
        ? allMerged.filter((p) => p.status === filter)
        : allMerged

    const counts: Record<string, number> = {}

    if (rpcResult.error) {
      console.warn('[useProjects] RPC failed, falling back to direct table select:', rpcResult.error.message)
      // Fallback: direct select (only works for authenticated users or if public SELECT policy exists)
      const { data: directVotes } = await supabase.from('votes').select('project_id')
      for (const v of (directVotes ?? []) as { project_id: string }[]) {
        counts[v.project_id] = (counts[v.project_id] ?? 0) + 1
      }
    } else if (rpcResult.data) {
      for (const row of rpcResult.data as { project_id: string; vote_count: number }[]) {
        counts[row.project_id] = row.vote_count
      }
    }

    setProjects(filtered)
    setVoteCounts(counts)
    setAssignedTeams(await fetchAssignedTeams(normalized))
    setError(null)
    setLoading(false)
  }, [filter])



  usePolling(fetchProjects, [filter])

  return { projects, assignedTeams, voteCounts, loading, error, refetch: fetchProjects }
}

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return

    const dummy = dummyProjects.find((p) => p.id === id)
    if (dummy) {
      setProject(dummy)
      setError(null)
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const p = data as Project
    setProject({ ...p, status: getEffectiveStatus(p) })
    setError(null)
    setLoading(false)
  }, [id])

  usePolling(fetchProject, [id])

  return { project, loading, error, refetch: fetchProject }
}
