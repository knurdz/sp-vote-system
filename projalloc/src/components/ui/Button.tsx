import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-accent font-semibold text-black border border-accent shadow-[0_0_20px_rgba(0,201,120,0.35)] hover:bg-accent-hover hover:shadow-[0_0_28px_rgba(0,201,120,0.5)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
  secondary:
    'bg-accent/10 font-medium text-accent border border-accent/70 hover:border-accent hover:bg-accent/15 active:scale-[0.98]',
  ghost:
    'bg-transparent text-text-secondary border border-border hover:border-accent/60 hover:bg-bg-elevated hover:text-text-primary active:scale-[0.98]',
  danger:
    'bg-red/10 font-medium text-red border border-red/50 hover:bg-red/15 active:scale-[0.98]',
}

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-[13px]',
  md: 'min-h-11 px-5 py-2.5 text-[14px]',
  lg: 'min-h-12 px-6 py-3 text-base font-semibold',
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
        'inline-flex cursor-pointer select-none items-center justify-center rounded-btn transition-all duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0',
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
