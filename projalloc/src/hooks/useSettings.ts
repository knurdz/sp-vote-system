import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SystemSettings } from '@/types'

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSettings(data as SystemSettings | null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const updateSettings = async (start: string, deadline: string) => {
    const { data, error: err } = await supabase
      .from('settings')
      .update({
        cv_upload_start: start,
        cv_upload_deadline: deadline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single()

    if (err) {
      throw err
    }

    setSettings(data as SystemSettings)
    return data as SystemSettings
  }

  return { settings, loading, error, refetch: fetchSettings, updateSettings }
}
