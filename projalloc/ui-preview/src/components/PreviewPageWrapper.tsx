import { Footer } from '@/components/layout/Footer'
import { PreviewNavbar } from './PreviewNavbar'

interface PreviewPageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PreviewPageWrapper({ children, className }: PreviewPageWrapperProps) {
  return (
    <div className="page-glow flex min-h-screen flex-col">
      <PreviewNavbar />
      <main className={`mx-auto w-full max-w-page flex-1 px-4 py-6 sm:px-8 sm:py-8 ${className ?? ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
