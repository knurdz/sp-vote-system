import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-[var(--border-cyan)] bg-[var(--panel-bg)] p-6 shadow-panel-inner backdrop-blur-sm transition-all duration-200 ease-out',
        onClick &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-ice/40 hover:shadow-card-hover',
        className,
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
