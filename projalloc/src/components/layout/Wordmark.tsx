import { Link } from 'react-router-dom'

interface WordmarkProps {
  className?: string
  asLink?: boolean
}

export function Wordmark({ className = '', asLink = true }: WordmarkProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 font-display text-[21px] tracking-tight ${className}`}>
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-accent transition-all duration-300"
        style={{ boxShadow: '0 0 10px var(--accent)' }}
        aria-hidden
      />
      <span className="font-bold">
        <span className="text-text-primary">Proj</span>
        <span className="text-accent">Alloc</span>
      </span>
    </span>
  )

  if (asLink) {
    return (
      <Link to="/" className="group inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    )
  }

  return content
}
