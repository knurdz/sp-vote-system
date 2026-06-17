import { cn } from '@/lib/utils'

interface CyanGlowProps {
  children: React.ReactNode
  className?: string
  intensity?: 'soft' | 'medium' | 'strong'
}

const INTENSITY = {
  soft: 'shadow-[var(--glow-cyan)]',
  medium: 'shadow-[var(--glow-cyan),var(--glow-ice)]',
  strong: 'shadow-[var(--glow-ice),0_0_40px_rgba(167,235,242,0.3)]',
}

export function CyanGlow({ children, className, intensity = 'soft' }: CyanGlowProps) {
  return (
    <div
      className={cn(
        'relative',
        INTENSITY[intensity],
        className,
      )}
    >
      {children}
    </div>
  )
}
