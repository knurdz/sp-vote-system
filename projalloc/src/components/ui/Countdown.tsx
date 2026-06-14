import { useEffect, useState } from 'react'
import { intervalToDuration } from 'date-fns'

interface CountdownProps {
  deadline: string
  onExpire?: () => void
  className?: string
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return 'Expired'
  const d = intervalToDuration({ start: 0, end: totalSeconds * 1000 })
  const parts = [
    d.days ? `${d.days}d` : null,
    d.hours ? `${d.hours}h` : null,
    d.minutes ? `${d.minutes}m` : null,
    `${d.seconds ?? 0}s`,
  ].filter(Boolean)
  return parts.join(' ')
}

function ClockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function Countdown({ deadline, onExpire, className }: CountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)),
  )

  useEffect(() => {
    const tick = () => {
      const secs = Math.max(
        0,
        Math.floor((new Date(deadline).getTime() - Date.now()) / 1000),
      )
      setRemaining(secs)
      if (secs === 0) onExpire?.()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline, onExpire])

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[13px] text-accent ${className ?? ''}`}
    >
      <ClockIcon />
      {formatDuration(remaining)}
    </span>
  )
}
