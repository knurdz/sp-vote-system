import { cn } from '@/lib/utils'
import { CrossHatchDecoration } from './CrossHatchDecoration'

interface CrossHatchPanelProps {
  children: React.ReactNode
  className?: string
  showOrnament?: boolean
  ornamentPosition?: 'top-left' | 'top-right' | 'bottom-right'
}

export function CrossHatchPanel({
  children,
  className,
  showOrnament = true,
  ornamentPosition = 'top-right',
}: CrossHatchPanelProps) {
  const ornamentClasses = {
    'top-left': 'absolute -left-6 -top-6 opacity-40',
    'top-right': 'absolute -right-8 -top-8 opacity-35',
    'bottom-right': 'absolute -bottom-6 -right-6 opacity-30',
  }

  return (
    <div className={cn('panel relative overflow-hidden', className)}>
      {showOrnament && (
        <CrossHatchDecoration
          variant="rect"
          className={ornamentClasses[ornamentPosition]}
          seed={13}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
