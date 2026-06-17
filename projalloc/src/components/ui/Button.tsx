import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-accent font-display font-semibold text-black border border-accent shadow-[0_4px_16px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_6px_22px_var(--accent-glow)]',
  secondary:
    'bg-accent/8 font-display font-semibold text-accent border border-accent/30 hover:border-accent/50 hover:bg-accent/15',
  ghost:
    'bg-transparent text-text-secondary border border-border font-display font-medium hover:border-accent/30 hover:bg-bg-elevated hover:text-text-primary',
  danger:
    'bg-red/8 font-display font-semibold text-red border border-red/30 hover:bg-red/15 hover:border-red/50',
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
      whileHover={disabled ? undefined : { scale: 1.015, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97, y: 0 }}
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
