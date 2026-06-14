import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { refreshAuthProfile } from '@/hooks/useAuthInit'
import type { Profile } from '@/types'

export function useAuth() {
  const { user, profile, role, loading, reset } = useAuthStore()

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
    return refreshAuthProfile()
  }, [])

  return { user, profile, role, loading, signInWithGoogle, signOut, refreshProfile }
}
