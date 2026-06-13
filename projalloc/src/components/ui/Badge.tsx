import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: ProjectStatus | 'admin' | 'leader' | 'viewer' | 'default'
  className?: string
}

const colors: Record<string, string> = {
  voting: 'bg-accent-glow text-green border border-accent/40',
  upcoming: 'bg-yellow/10 text-yellow border border-yellow/40',
  closed: 'bg-status-closed/10 text-status-closed border border-status-closed/40',
  assigned: 'bg-status-assigned/10 text-status-assigned border border-status-assigned/40',
  admin: 'bg-accent-glow text-accent border border-accent/40',
  leader: 'bg-accent-glow text-green border border-accent/40',
  viewer: 'bg-gray/10 text-text-secondary border border-gray/40',
  default: 'bg-bg-elevated text-text-secondary border border-border',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-medium',
        colors[variant] ?? colors.default,
        className,
      )}
    >
      {variant === 'voting' && (
        <span className="h-1 w-1 rounded-full bg-green animate-pulse-dot" aria-hidden />
      )}
      {children}
    </span>
  )
}
