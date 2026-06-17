import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface SpinResultProps {
  open: boolean
  winnerName: string
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}

export function SpinResult({ open, winnerName, onConfirm, loading, error }: SpinResultProps) {
  useEffect(() => {
    if (!open) return
    void confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00C978', '#4DA3FF', '#FFD600', '#F5F5F5'],
    })
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="spin-overlay-card relative z-10 max-w-sm"
      >
        <div className="spin-overlay-accent" />
        <div className="px-6 py-8 text-center">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-accent">
            Spin Complete
          </p>
          <p className="mt-2 text-sm text-text-secondary">Selected Team</p>
          <p className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-text-primary">{winnerName}</p>
          <p className="mt-3.5 text-xs leading-relaxed text-text-muted">
            This result is final. Confirm to assign the team to this project.
          </p>

          {error && (
            <div className="mt-4 text-left">
              <Alert message={error} />
            </div>
          )}

          <Button
            type="button"
            className="mt-8 w-full"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Locking…' : 'Confirm & Lock'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
