import { useCallback, useEffect } from 'react'
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

  if (error) {
    return null
  }
  return data as Profile
}

async function forceSignOut(reset: () => void) {
  reset()
  await supabase.auth.signOut()
}

export function useAuth() {
  const { user, profile, role, loading, setUser, setProfile, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    let mounted = true

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        const p = await fetchProfile(session.user.id)
        if (!mounted) return
        if (!p) {
          await forceSignOut(reset)
          return
        }
        setProfile(p)
      }
      if (mounted) setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        reset()
        if (mounted) setLoading(false)
        return
      }

      setUser(session.user)
      const p = await fetchProfile(session.user.id)
      if (!mounted) return

      if (!p) {
        await forceSignOut(reset)
        return
      }

      setProfile(p)
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [reset, setLoading, setProfile, setUser])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    reset()
  }, [reset])

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null
    const p = await fetchProfile(user.id)
    if (!p) {
      await forceSignOut(reset)
      return null
    }
    setProfile(p)
    return p
  }, [user, reset, setProfile])

  return { user, profile, role, loading, signInWithGoogle, signOut, refreshProfile }
}
