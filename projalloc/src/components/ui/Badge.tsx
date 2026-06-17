import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: ProjectStatus | 'admin' | 'leader' | 'viewer' | 'default'
  className?: string
}

const colors: Record<string, string> = {
  voting: 'bg-accent/8 text-green border border-accent/25',
  upcoming: 'bg-yellow/8 text-yellow border border-yellow/25',
  closed: 'bg-gray/8 text-text-muted border border-border',
  assigned: 'bg-status-assigned/8 text-status-assigned border border-status-assigned/25',
  admin: 'bg-accent/8 text-accent border border-accent/25',
  leader: 'bg-accent/8 text-green border border-accent/25',
  viewer: 'bg-gray/8 text-text-secondary border border-border',
  default: 'bg-bg-elevated text-text-secondary border border-border',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border',
        colors[variant] ?? colors.default,
        className,
      )}
    >
      {variant === 'voting' && (
        <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse-dot" aria-hidden />
      )}
      {children}
    </span>
  )
}
