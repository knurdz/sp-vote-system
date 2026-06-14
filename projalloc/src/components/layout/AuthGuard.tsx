import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading || !user || role !== 'viewer') return
    if (location.pathname !== '/access-denied') {
      navigate('/access-denied', { replace: true })
    }
  }, [user, role, loading, location.pathname, navigate])

  return <>{children}</>
}
