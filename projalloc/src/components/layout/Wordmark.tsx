import { Link } from 'react-router-dom'

interface WordmarkProps {
  className?: string
  asLink?: boolean
}

export function Wordmark({ className = '', asLink = true }: WordmarkProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 font-display text-[20px] ${className}`}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-ice"
        style={{ boxShadow: 'var(--glow-ice)' }}
        aria-hidden
      />
      <span>
        <span className="font-semibold text-text-primary">Proj</span>
        <span className="font-semibold text-accent">Alloc</span>
      </span>
    </span>
  )

  if (asLink) {
    return <Link to="/">{content}</Link>
  }

  return content
}
