interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={`page-glow relative min-h-screen bg-bg-base ${className ?? ''}`}>
      <div className="board-side-glow hidden xl:block" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}
