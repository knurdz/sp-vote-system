import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-accent font-display font-semibold text-white border border-accent shadow-[0_4px_16px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_8px_24px_rgba(59,130,246,0.25)]',
  secondary:
    'bg-accent/8 backdrop-blur-sm font-display font-semibold text-accent border border-accent/25 hover:border-accent/45 hover:bg-accent/16 shadow-[0_4px_12px_rgba(0,0,0,0.03)]',
  ghost:
    'bg-bg-surface/30 backdrop-blur-sm text-text-secondary border border-border font-display font-medium hover:border-accent/35 hover:bg-bg-elevated hover:text-text-primary shadow-[0_4px_12px_rgba(0,0,0,0.02)]',
  danger:
    'bg-red/8 backdrop-blur-sm font-display font-semibold text-red border border-red/25 hover:bg-red/15 hover:border-red/45 shadow-[0_4px_12px_rgba(0,0,0,0.02)]',
}

const sizes = {
  sm: 'min-h-9 px-3.5 py-1.5 text-[13px] rounded-lg',
  md: 'min-h-11 px-5 py-2.5 text-[14px] rounded-btn',
  lg: 'min-h-12 px-6 py-3.5 text-base font-semibold rounded-btn',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.01, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className={cn(
        'inline-flex cursor-pointer select-none items-center justify-center rounded-btn transition-colors duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
