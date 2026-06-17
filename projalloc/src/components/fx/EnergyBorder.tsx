import { cn } from '@/lib/utils'

interface EnergyBorderProps {
  children: React.ReactNode
  className?: string
  pulse?: boolean
}

export function EnergyBorder({ children, className, pulse = false }: EnergyBorderProps) {
  return (
    <div
      className={cn(
        'relative rounded-card p-px',
        pulse && 'motion-safe:animate-energy-pulse',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(167,235,242,0.5), rgba(84,172,191,0.3), rgba(38,101,140,0.4), rgba(167,235,242,0.5))',
      }}
    >
      <div className="relative rounded-[15px] bg-[var(--panel-bg)] backdrop-blur-sm">
        {children}
      </div>
    </div>
  )
}
