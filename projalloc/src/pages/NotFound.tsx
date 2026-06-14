import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <PageWrapper className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="panel w-full max-w-md p-8 text-center">
        <p className="mb-2 font-mono text-5xl font-bold text-accent">404</p>
        <h1 className="mb-2 text-2xl font-bold text-text-primary">Page not found</h1>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="flex justify-center">
          <Link to="/">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
