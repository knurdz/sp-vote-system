import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: ProjectStatus | 'admin' | 'leader' | 'viewer' | 'default'
  className?: string
}

const colors: Record<string, string> = {
  voting: 'bg-accent/8 backdrop-blur-[2px] text-accent border border-accent/20 shadow-[0_2px_8px_rgba(59,130,246,0.06)]',
  upcoming: 'bg-yellow/8 backdrop-blur-[2px] text-yellow border border-yellow/20 shadow-[0_2px_8px_rgba(245,158,11,0.06)]',
  closed: 'bg-text-muted/5 backdrop-blur-[2px] text-text-muted border border-border shadow-sm',
  assigned: 'bg-status-assigned/8 backdrop-blur-[2px] text-status-assigned border border-status-assigned/20 shadow-[0_2px_8px_rgba(59,130,246,0.06)]',
  admin: 'bg-accent/8 backdrop-blur-[2px] text-accent border border-accent/20 shadow-[0_2px_8px_rgba(59,130,246,0.06)]',
  leader: 'bg-accent/8 backdrop-blur-[2px] text-accent border border-accent/20 shadow-[0_2px_8px_rgba(59,130,246,0.06)]',
  viewer: 'bg-text-muted/5 backdrop-blur-[2px] text-text-secondary border border-border',
  default: 'bg-bg-elevated/50 backdrop-blur-[2px] text-text-secondary border border-border',
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
      {children}
    </span>
  )
}
