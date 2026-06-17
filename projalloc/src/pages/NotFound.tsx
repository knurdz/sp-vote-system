import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { CrossHatchDecoration, EnergyBorder } from '@/components/fx'

export function NotFound() {
  return (
    <PageWrapper className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <EnergyBorder className="w-full max-w-md">
        <div className="relative p-8 text-center">
          <CrossHatchDecoration
            variant="circle"
            className="absolute left-1/2 top-4 -translate-x-1/2 opacity-30"
            seed={404}
          />
          <p className="relative z-10 mb-2 font-display text-5xl font-bold text-ice">
            404
          </p>
          <h1 className="relative z-10 mb-2 font-display text-2xl font-bold text-text-primary">
            Page not found
          </h1>
          <p className="relative z-10 mb-6 text-sm leading-relaxed text-text-secondary">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="relative z-10 flex justify-center">
            <Link to="/">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </div>
      </EnergyBorder>
    </PageWrapper>
  )
}
