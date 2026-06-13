import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Wordmark } from '@/components/layout/Wordmark'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Footer } from '@/components/layout/Footer'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { user, role, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (role === 'viewer') {
        navigate('/access-denied', { replace: true })
      } else if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [user, role, loading, navigate])

  const handleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      setSigningIn(false)
    }
  }

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

  return (
    <PageWrapper className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Wordmark asLink={false} />
        </div>
        <p className="mb-8 text-sm text-text-secondary">
          Sign in with your registered Google account to vote or manage projects.
        </p>

        {error && (
          <div className="mb-4">
            <Alert message={error} />
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={signingIn}
          onClick={() => void handleSignIn()}
        >
          {signingIn ? 'Redirecting…' : 'Sign in with Google'}
        </Button>
      </div>
    </PageWrapper>
  )
}
