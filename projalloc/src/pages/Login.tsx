import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

function GoogleIcon() {
  return (
    <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  )
}

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
      <PageWrapper className="flex flex-1 items-center justify-center pt-8 pb-12">
        <Spinner />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="flex flex-1 items-center justify-center pt-8 pb-12">
      <div className="relative w-full max-w-md">
        {/* Ambient background glow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent/20 to-accent-glow opacity-40 blur-2xl" aria-hidden />

        <div className="panel relative w-full p-8 text-center bg-white dark:bg-[#14120B]/80 border border-border/40 backdrop-blur-md rounded-2xl">
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
            className="w-full inline-flex items-center justify-center cursor-pointer"
            disabled={signingIn}
            onClick={() => void handleSignIn()}
          >
            {signingIn ? (
              'Redirecting…'
            ) : (
              <>
                <GoogleIcon />
                <span>Sign in with Google</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
