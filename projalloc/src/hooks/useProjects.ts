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

export function useProjects(filter?: ProjectStatus | 'all') {
  const [projects, setProjects] = useState<Project[]>([])
  const [assignedTeams, setAssignedTeams] = useState<Record<string, AssignedTeamInfo>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const normalized = (data as Project[]).map((p) => ({
      ...p,
      status: getEffectiveStatus(p),
    }))

    const filtered =
      filter && filter !== 'all'
        ? normalized.filter((p) => p.status === filter)
        : normalized

    setProjects(filtered)
    setAssignedTeams(await fetchAssignedTeams(normalized))
    setError(null)
    setLoading(false)
  }, [filter])

  usePolling(fetchProjects, [filter])

  return { projects, assignedTeams, loading, error, refetch: fetchProjects }
}

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return
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
