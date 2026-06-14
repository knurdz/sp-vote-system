import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageShell } from './PageShell'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <PageShell>
      <Navbar />
      <main
        className={cn(
          'mx-auto flex w-full max-w-page flex-1 flex-col px-4 py-8 sm:px-8',
          className,
        )}
      >
        {children}
      </main>
      <Footer />
    </PageShell>
  )
}
