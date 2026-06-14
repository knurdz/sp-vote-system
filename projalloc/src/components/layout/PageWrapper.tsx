import { Navbar } from './Navbar'
import { Footer } from './Footer'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className="page-glow flex min-h-screen flex-col bg-bg-base">
      <Navbar />
      <main className={`mx-auto w-full max-w-page flex-1 px-4 py-6 sm:px-8 sm:py-8 ${className ?? ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
