import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-accent text-black border border-accent hover:bg-accent-hover hover:shadow-accent-glow active:scale-[0.98]',
  secondary:
    'bg-transparent text-accent border border-accent/60 hover:border-accent hover:bg-accent-glow',
  ghost:
    'bg-transparent text-text-secondary border border-border hover:border-accent/60 hover:text-text-primary',
  danger:
    'bg-transparent text-red border border-red/40 hover:bg-red/10',
}

const sizes = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2 text-[14px]',
  lg: 'px-6 py-3 text-base font-semibold',
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
        'inline-flex cursor-pointer select-none items-center justify-center rounded-btn font-medium transition-all duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50',
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
