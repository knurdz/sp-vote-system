import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface SpinResultProps {
  open: boolean
  winnerName: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  error?: string | null
}

export function SpinResult({
  open,
  winnerName,
  onConfirm,
  onCancel,
  loading,
  error,
}: SpinResultProps) {
  useEffect(() => {
    if (!open) return
    void confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    })
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Spin Result"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Locking…' : 'Confirm & Lock'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}
      <div className="py-8 text-center">
        <div className="mb-4 text-5xl">🏆</div>
        <p className="mb-2 text-sm text-text-secondary">Winning Team</p>
        <p className="text-3xl font-bold text-accent-hover">{winnerName}</p>
      </div>
    </Modal>
  )
}
