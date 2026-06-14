import { useEffect } from 'react'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

async function forceSignOut(reset: () => void) {
  reset()
  await supabase.auth.signOut()
}

let bootstrapStarted = false

function bootstrapAuth() {
  if (bootstrapStarted) return
  bootstrapStarted = true

  const { setUser, setLoading, reset } = useAuthStore.getState()

  void (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
      } else {
        reset()
        setLoading(false)
      }
    } catch {
      reset()
      setLoading(false)
    }

    supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        reset()
        return
      }
      setUser(session.user)
    })
  })()
}

export function useAuthInit() {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    bootstrapAuth()
  }, [])

  useEffect(() => {
    if (!userId) return

    let mounted = true
    const { setProfile, setLoading, reset } = useAuthStore.getState()
    setLoading(true)

    void (async () => {
      try {
        const profile = await fetchProfile(userId)
        if (!mounted) return

        if (!profile) {
          await forceSignOut(reset)
          return
        }

        setProfile(profile)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [userId])
}

export async function refreshAuthProfile(): Promise<Profile | null> {
  const { user, setProfile, reset } = useAuthStore.getState()
  if (!user) return null

  const profile = await fetchProfile(user.id)
  if (!profile) {
    await forceSignOut(reset)
    return null
  }

  setProfile(profile)
  return profile
}
