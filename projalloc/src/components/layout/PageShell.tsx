import { useLocation } from 'react-router-dom'

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  const { pathname } = useLocation()
  const reserveMobileNavSpace = pathname !== '/login'

  return (
    <div className={`page-glow relative min-h-screen bg-bg-base bg-theme-bg bg-cover bg-center bg-fixed bg-no-repeat ${className ?? ''}`}>
      <div className="board-side-glow hidden xl:block" aria-hidden />
      <div className={`relative z-10 flex min-h-screen flex-col ${reserveMobileNavSpace ? 'pb-28 xl:pb-0' : ''}`}>{children}</div>
    </div>
  )
}
