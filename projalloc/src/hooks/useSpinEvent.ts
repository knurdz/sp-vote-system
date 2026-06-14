import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePolling } from '@/hooks/usePolling'
import type { SpinEvent, SpinLog, Team } from '@/types'

export function useSpinEvent(projectId: string | undefined) {
  const [spinEvent, setSpinEvent] = useState<SpinEvent | null>(null)
  const [spinLog, setSpinLog] = useState<SpinLog | null>(null)
  const [candidates, setCandidates] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSpinData = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    const { data: event, error: eventErr } = await supabase
      .from('spin_events')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()

    if (eventErr) {
      setError(eventErr.message)
      setLoading(false)
      return
    }

    setSpinEvent(event as SpinEvent | null)

    if (event) {
      const { data: log } = await supabase
        .from('spin_logs')
        .select('*')
        .eq('spin_event_id', event.id)
        .maybeSingle()

      setSpinLog((log as SpinLog) ?? null)
    } else {
      setSpinLog(null)
    }

    const { data: votes, error: votesErr } = await supabase
      .from('votes')
      .select('team_id, teams(*)')
      .eq('project_id', projectId)

    if (votesErr) {
      setError(votesErr.message)
      setLoading(false)
      return
    }

    const teams = (votes ?? [])
      .map((v) => {
        const t = v.teams as Team | Team[] | null
        return Array.isArray(t) ? t[0] : t
      })
      .filter((t): t is Team => t !== null && t !== undefined)

    setCandidates(teams)
    setError(null)
    setLoading(false)
  }, [projectId])

  usePolling(fetchSpinData, [projectId])

  return {
    spinEvent,
    spinLog,
    candidates,
    loading,
    error,
    refetch: fetchSpinData,
    isLocked: !!spinLog,
  }
}

export function useSpinLogs() {
  const [logs, setLogs] = useState<SpinLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('spin_logs')
      .select('*')
      .order('timestamp', { ascending: false })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setLogs((data ?? []) as SpinLog[])
    setError(null)
    setLoading(false)
  }, [])

  usePolling(fetchLogs, [])

  return { logs, loading, error, refetch: fetchLogs }
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    openVotes: 0,
    upcomingSpins: 0,
    assigned: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const [projectsRes, spinsRes] = await Promise.all([
      supabase.from('projects').select('status'),
      supabase.from('spin_events').select('scheduled_at, spun_at'),
    ])

    const projects = projectsRes.data ?? []
    setStats({
      totalProjects: projects.length,
      openVotes: projects.filter((p) => p.status === 'voting').length,
      upcomingSpins: (spinsRes.data ?? []).filter(
        (s) => s.scheduled_at && !s.spun_at,
      ).length,
      assigned: projects.filter((p) => p.status === 'assigned').length,
    })
    setLoading(false)
  }, [])

  usePolling(fetchStats, [])

  return { stats, loading, refetch: fetchStats }
}
