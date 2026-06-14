import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'
import { Footer } from '@/components/layout/Footer'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-glow flex min-h-screen flex-col bg-bg-base">
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role === 'viewer') {
    return <Navigate to="/access-denied" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
}
