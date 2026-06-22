import { useCallback, useEffect, useRef, useState } from 'react'
import { truncate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const SEGMENT_COLORS = [
  '#00C978',
  '#00A862',
  '#4DA3FF',
  '#3B82F6',
  '#A78BFA',
  '#8B5CF6',
  '#F59E0B',
  '#F472B6',
  '#22D3EE',
  '#64748B',
]

function segmentTextColor(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#0A0A0A' : '#F5F5F5'
}

interface SpinWheelProps {
  candidates: { id: string; name: string }[]
  onSpinComplete: (winner: { id: string; name: string }) => void
  onSpinStart: () => Promise<{ id: string; name: string }>
  disabled?: boolean
  size?: number
  compact?: boolean
}

export function SpinWheel({
  candidates,
  onSpinComplete,
  onSpinStart,
  disabled,
  size = 560,
  compact = false,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const rotationRef = useRef(0)
  const animRef = useRef<number>(0)

  const center = size / 2
  const radius = size / 2 - size * 0.08
  const hubRadius = size * 0.055
  const fontSize = Math.max(11, Math.round(size * 0.032))
  const pointer = Math.round(size * 0.045)

  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas || candidates.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)

    // Outer glow ring
    ctx.beginPath()
    ctx.arc(center, center, radius + size * 0.02, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(0, 201, 120, 0.25)'
    ctx.lineWidth = size * 0.012
    ctx.stroke()

    const slice = (2 * Math.PI) / candidates.length

    candidates.forEach((team, i) => {
      const start = rotation + i * slice
      const end = start + slice
      const fill = SEGMENT_COLORS[i % SEGMENT_COLORS.length]

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.lineWidth = Math.max(1.5, size / 240)
      ctx.stroke()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(start + slice / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = segmentTextColor(fill)
      ctx.font = `600 ${fontSize}px Outfit, sans-serif`
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 3
      ctx.fillText(truncate(team.name, 16), radius - size * 0.06, fontSize * 0.35)
      ctx.shadowBlur = 0
      ctx.restore()
    })

    // Pegs
    for (let i = 0; i < 36; i++) {
      const angle = rotation + (i / 36) * 2 * Math.PI
      const inner = radius + size * 0.008
      const outer = radius + size * 0.028
      ctx.beginPath()
      ctx.moveTo(center + inner * Math.cos(angle), center + inner * Math.sin(angle))
      ctx.lineTo(center + outer * Math.cos(angle), center + outer * Math.sin(angle))
      ctx.strokeStyle = i % 3 === 0 ? '#1A1A1A' : '#2A2A2A'
      ctx.lineWidth = i % 3 === 0 ? 2 : 1
      ctx.stroke()
    }

    // Hub
    const hubGrad = ctx.createRadialGradient(center, center, 0, center, center, hubRadius)
    hubGrad.addColorStop(0, '#222222')
    hubGrad.addColorStop(1, '#0A0A0A')
    ctx.beginPath()
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.fill()
    ctx.strokeStyle = '#00C978'
    ctx.lineWidth = Math.max(2.5, size / 160)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(center, center, hubRadius * 0.35, 0, 2 * Math.PI)
    ctx.fillStyle = '#00C978'
    ctx.fill()
  }, [candidates, center, fontSize, hubRadius, radius, size])

  useEffect(() => {
    drawWheel(rotationRef.current)
  }, [drawWheel])

  const spin = async () => {
    if (spinning || disabled || candidates.length === 0) return

    setSpinning(true)

    let winner: { id: string; name: string }
    try {
      winner = await onSpinStart()
    } catch {
      setSpinning(false)
      return
    }

    const winnerIndex = candidates.findIndex((candidate) => candidate.id === winner.id)
    if (winnerIndex < 0) {
      setSpinning(false)
      onSpinComplete(winner)
      return
    }

    const slice = (2 * Math.PI) / candidates.length

    const targetRotation =
      -Math.PI / 2 - (winnerIndex + 0.5) * slice + 2 * Math.PI * 6

    const startRotation = rotationRef.current
    const delta = targetRotation - startRotation
    const duration = 4500
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      rotationRef.current = startRotation + delta * eased
      drawWheel(rotationRef.current)

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        onSpinComplete(winner)
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  if (candidates.length === 0) {
    return (
      <div className="spin-wheel-empty flex flex-col items-center justify-center gap-1" style={{ width: size, height: size }}>
        <span className="text-sm text-text-secondary">No teams on the wheel</span>
        <span className="text-xs text-text-muted">Teams appear after leaders vote on this project.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="spin-wheel-stage" style={{ width: size, height: size }}>
        <div
          className="spin-wheel-pointer"
          style={{
            borderLeft: `${pointer}px solid transparent`,
            borderRight: `${pointer}px solid transparent`,
            borderTop: `${pointer * 2.2}px solid #00C978`,
            marginBottom: `-${Math.round(pointer * 0.5)}px`,
          }}
        />
        <div className="spin-wheel-frame">
          <canvas ref={canvasRef} width={size} height={size} className="block rounded-full" />
        </div>
      </div>

      <Button
        size={compact ? 'md' : 'lg'}
        disabled={spinning || disabled}
        onClick={() => void spin()}
        className={compact ? 'mt-4 min-w-[160px]' : 'mt-6 min-w-[200px]'}
      >
        {spinning ? 'Spinning…' : 'Spin the Wheel'}
      </Button>
    </div>
  )
}
