import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-accent text-midnight border border-cyan hover:bg-accent-hover hover:shadow-glow-cyan hover:border-ice active:scale-[0.98] active:bg-cyan motion-safe:animate-energy-pulse focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-midnight',
  secondary:
    'bg-transparent text-accent border border-cyan/60 hover:border-ice hover:bg-accent-glow hover:shadow-glow-cyan active:scale-[0.98] active:border-cyan focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-midnight',
  ghost:
    'bg-transparent text-text-secondary border border-border hover:border-cyan/50 hover:text-text-primary hover:bg-ocean/30 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-midnight',
  danger:
    'bg-transparent text-red border border-red/40 hover:bg-red/10 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-midnight',
}

const sizes = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2 text-[14px]',
  lg: 'px-6 py-3 text-base font-semibold min-h-[44px]',
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
    <button
      className={cn(
        'inline-flex cursor-pointer select-none items-center justify-center rounded-btn font-medium transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:animate-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
