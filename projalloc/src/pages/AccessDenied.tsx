import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function AccessDenied() {
  const { signOut } = useAuth()

  return (
    <PageWrapper className="flex flex-1 items-center justify-center">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-2xl font-bold text-text-primary">Access Denied</h1>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          Your Google account is not registered as an admin or team on
          ProjAlloc. Contact your project coordinator if you need access.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="secondary">View Projects</Button>
          </Link>
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
