import { Link } from 'react-router-dom'

interface WordmarkProps {
  className?: string
  asLink?: boolean
}

export function Wordmark({ className = '', asLink = true }: WordmarkProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 font-display text-[21px] tracking-tight ${className}`}>
      {/* Dynamic SVG Logo for FITsp (Clockwise circular spinner/crosshair target) */}
      <svg
        className="h-6.5 w-6.5 shrink-0 text-accent transition-transform duration-500 group-hover:rotate-90"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        aria-hidden
      >
        {/* Guidelines */}
        <line x1="50" y1="12" x2="50" y2="88" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
        <line x1="12" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
        
        {/* Diagonals */}
        <line x1="24" y1="24" x2="76" y2="76" stroke="currentColor" strokeWidth="2" strokeOpacity="0.18" />
        <line x1="24" y1="76" x2="76" y2="24" stroke="currentColor" strokeWidth="2" strokeOpacity="0.18" />
        
        {/* Diagonal dot nodes */}
        <circle cx="34" cy="34" r="4.5" fill="currentColor" />
        <circle cx="66" cy="34" r="4.5" fill="currentColor" />
        <circle cx="34" cy="68" r="4.5" fill="currentColor" />
        <circle cx="66" cy="68" r="4.5" fill="currentColor" />

        {/* Dash ticks ring */}
        <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="5,8" strokeOpacity="0.35" />
        
        {/* Main circular arrow */}
        <path d="M 50 12 A 38 38 0 1 1 85 34" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        
        {/* Arrow Head */}
        <path d="M 77 34 L 88 28 L 84 41 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      </svg>

      <span className="font-black text-[22px] tracking-tight">
        <span className="text-text-primary">FIT</span>
        <span className="text-accent font-semibold">sp</span>
      </span>
    </span>
  )

  if (asLink) {
    return (
      <Link to="/" className="group inline-flex min-h-11 items-center transition-opacity hover:opacity-95">
        {content}
      </Link>
    )
  }

  return content
}
