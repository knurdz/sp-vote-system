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
      whileHover={onClick ? { y: -4, borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))' } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      className={cn(
        'rounded-card border border-border bg-bg-surface p-6 shadow-panel backdrop-blur-md transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-[0_12px_40px_rgba(0,201,120,0.08)]',
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
