import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'
import { Footer } from '@/components/layout/Footer'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [verifiedRole, setVerifiedRole] = useState<Role | null>(null)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    let mounted = true

    async function verify() {
      if (loading) return

      if (!user) {
        if (mounted) {
          setVerifiedRole(null)
          setVerifying(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      if (error || !data) {
        await supabase.auth.signOut()
        setVerifiedRole(null)
        setVerifying(false)
        return
      }

      setVerifiedRole(data.role as Role)
      setVerifying(false)
    }

    setVerifying(true)
    void verify()

    return () => {
      mounted = false
    }
  }, [user, loading])

  if (loading || verifying) {
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

  if (verifiedRole === 'viewer') {
    return <Navigate to="/access-denied" replace />
  }

  if (requiredRole && verifiedRole !== requiredRole) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
}
