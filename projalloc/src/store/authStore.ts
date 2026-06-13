import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, Role } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  role: Role | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({ profile, role: profile?.role ?? null }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, profile: null, role: null, loading: false }),
}))
