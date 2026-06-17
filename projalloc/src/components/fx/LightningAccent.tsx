import { cn } from '@/lib/utils'

interface LightningAccentProps {
  className?: string
  variant?: 'hero' | 'compact'
}

export function LightningAccent({ className, variant = 'hero' }: LightningAccentProps) {
  const size = variant === 'hero' ? 'h-48 w-full max-w-2xl' : 'h-24 w-48'

  return (
    <svg
      className={cn(
        'pointer-events-none select-none motion-safe:animate-lightning-flicker',
        size,
        className,
      )}
      viewBox="0 0 400 120"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="lightning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A7EBF2" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#54ACBF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#54ACBF" stopOpacity="0.2" />
        </linearGradient>
        <filter id="lightning-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Primary streak */}
      <path
        d="M 20 80 L 45 55 L 38 70 L 72 30 L 55 58 L 95 20 L 78 50 L 130 15 L 110 45 L 160 25 L 145 55 L 200 35"
        stroke="url(#lightning-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#lightning-glow)"
        opacity="0.85"
      />

      {/* Secondary thin streaks */}
      <path
        d="M 180 90 L 210 65 L 205 78 L 240 50"
        stroke="#A7EBF2"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M 250 95 L 275 70 L 268 82 L 310 55 L 295 75 L 340 45"
        stroke="#54ACBF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Energy sparks */}
      <circle cx="72" cy="30" r="2" fill="#A7EBF2" opacity="0.8" />
      <circle cx="130" cy="15" r="1.5" fill="#A7EBF2" opacity="0.6" />
      <circle cx="200" cy="35" r="1.5" fill="#54ACBF" opacity="0.5" />
    </svg>
  )
}
