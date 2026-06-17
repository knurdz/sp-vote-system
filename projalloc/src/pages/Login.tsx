import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Wordmark } from '@/components/layout/Wordmark'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Footer } from '@/components/layout/Footer'
import { PageShell } from '@/components/layout/PageShell'
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
      <PageShell>
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </PageShell>
    )
  }

  return (
    <PageWrapper className="flex flex-1 items-center justify-center pt-8 pb-12">
      <div className="relative w-full max-w-md">
        {/* Ambient background glow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent/20 to-accent-glow opacity-40 blur-2xl" aria-hidden />

        <div className="panel relative w-full p-8 text-center">
          <div className="mb-6 flex justify-center">
            <Wordmark asLink={false} />
          </div>
          <p className="mb-8 text-sm leading-relaxed text-text-secondary">
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
      </div>
    </PageWrapper>
  )
}
