import { useEffect } from 'react'
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
      colors: ['#54ACBF', '#A7EBF2', '#26658C', '#F0F9FA'],
    })
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div className="spin-overlay-card relative z-10 max-w-sm">
        <div className="spin-overlay-accent" />
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan/40 bg-accent-glow text-3xl shadow-glow-cyan">
            🏆
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
            Spin complete
          </p>
          <p className="mt-1 text-sm text-text-secondary">Winning team</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{winnerName}</p>
          <p className="mt-3 text-xs text-text-muted">
            This result is final. Confirm to assign the team.
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
      </div>
    </div>
  )
}
