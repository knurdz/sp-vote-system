const styles = {
  error: 'border-red/30 bg-red/10 text-red',
  info: 'border-accent/30 bg-accent-glow text-accent-hover',
  success: 'border-accent/30 bg-accent/10 text-accent',
}

interface AlertProps {
  message: string
  variant?: 'error' | 'info' | 'success'
}

export function Alert({ message, variant = 'error' }: AlertProps) {
  if (!message) return null
  return (
    <div className={`rounded-btn border px-4 py-3 text-sm ${styles[variant]}`}>
      {message}
    </div>
  )
}
