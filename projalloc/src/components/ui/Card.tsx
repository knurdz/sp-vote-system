import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -6, borderColor: 'color-mix(in srgb, var(--accent) 50%, var(--border))' } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      className={cn(
        'rounded-card border border-border bg-bg-surface p-6 shadow-panel transition-colors duration-200',
        onClick && 'cursor-pointer hover:shadow-card-hover',
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
    </motion.div>
  )
}
