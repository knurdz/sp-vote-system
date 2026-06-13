import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePolling } from '@/hooks/usePolling'
import { getEffectiveStatus } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types'

export function useProjects(filter?: ProjectStatus | 'all') {
  const [projects, setProjects] = useState<Project[]>([])
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

    setProjects(
      filter && filter !== 'all'
        ? normalized.filter((p) => p.status === filter)
        : normalized,
    )
    setError(null)
    setLoading(false)
  }, [filter])

  usePolling(fetchProjects, [filter])

  return { projects, loading, error, refetch: fetchProjects }
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
