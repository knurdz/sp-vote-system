import { cn } from '@/lib/utils'

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen flex flex-col bg-[#F4F7FC] dark:bg-[#050914] text-text-primary transition-colors duration-200", className)}>
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {children}
      </div>
    </div>
  )
}
