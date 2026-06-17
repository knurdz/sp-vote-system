import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: ProjectStatus | 'admin' | 'leader' | 'viewer' | 'default'
  className?: string
}

const colors: Record<string, string> = {
  voting: 'bg-accent-glow text-cyan border border-cyan/40',
  upcoming: 'bg-yellow/10 text-yellow border border-yellow/40',
  closed: 'bg-steel/20 text-status-closed border border-steel/40',
  assigned: 'bg-ice/10 text-ice border border-ice/40',
  admin: 'bg-accent-glow text-cyan border border-cyan/40',
  leader: 'bg-accent-glow text-cyan border border-cyan/40',
  viewer: 'bg-steel/15 text-text-secondary border border-steel/30',
  default: 'bg-ocean/50 text-text-secondary border border-border',
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
        <span className="h-1 w-1 rounded-full bg-cyan animate-pulse-dot" aria-hidden />
      )}
      {children}
    </span>
  )
}
