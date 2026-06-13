import { useEffect, useRef, useState } from 'react'
import { truncate } from '@/lib/utils'

const SEGMENT_COLORS = [
  '#00C978',
  '#4DA3FF',
  '#F5A623',
  '#A78BFA',
  '#F472B6',
  '#22D3EE',
  '#FB923C',
  '#9CA3AF',
]

function segmentTextColor(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.58 ? '#0A0A0A' : '#FFFFFF'
}

interface SpinWheelProps {
  candidates: { id: string; name: string }[]
  onSpinComplete: (winner: { id: string; name: string }) => void
  disabled?: boolean
}

export function SpinWheel({ candidates, onSpinComplete, disabled }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const rotationRef = useRef(0)
  const animRef = useRef<number>(0)

  const size = 560
  const center = size / 2
  const radius = size / 2 - 20

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas || candidates.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)
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
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(start + slice / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = segmentTextColor(fill)
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.fillText(truncate(team.name, 18), radius - 16, 6)
      ctx.restore()
    })

    for (let i = 0; i < 48; i++) {
      const angle = rotation + (i / 48) * 2 * Math.PI
      const inner = radius + 4
      const outer = radius + 12
      ctx.beginPath()
      ctx.moveTo(center + inner * Math.cos(angle), center + inner * Math.sin(angle))
      ctx.lineTo(center + outer * Math.cos(angle), center + outer * Math.sin(angle))
      ctx.strokeStyle = '#1A1A1A'
      ctx.lineWidth = i % 4 === 0 ? 2 : 1
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(center, center, 24, 0, 2 * Math.PI)
    ctx.fillStyle = '#0A0A0A'
    ctx.fill()
    ctx.strokeStyle = '#00C978'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  useEffect(() => {
    drawWheel(rotationRef.current)
  }, [candidates])

  const spin = () => {
    if (spinning || disabled || candidates.length === 0) return

    const winnerIndex = Math.floor(Math.random() * candidates.length)
    const winner = candidates[winnerIndex]
    const slice = (2 * Math.PI) / candidates.length

    // Pointer at top ( -PI/2 ), land winner center under pointer
    const targetRotation =
      -Math.PI / 2 - (winnerIndex + 0.5) * slice + 2 * Math.PI * 6

    const startRotation = rotationRef.current
    const delta = targetRotation - startRotation
    const duration = 4500
    const startTime = performance.now()

    setSpinning(true)

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
      <div className="flex h-[560px] w-[560px] items-center justify-center rounded-full border border-border text-text-secondary">
        No candidates on the wheel
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="absolute top-0 z-10 h-0 w-0"
        style={{
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '28px solid #FFFFFF',
          transform: 'translateY(-4px)',
        }}
      />
      <canvas ref={canvasRef} width={size} height={size} className="rounded-full" />
      <button
        type="button"
        onClick={spin}
        disabled={spinning || disabled}
        className="mt-8 rounded-btn bg-accent px-12 py-4 text-2xl font-bold text-white transition-all duration-150 hover:bg-accent-hover hover:shadow-accent-glow disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        {spinning ? 'SPINNING…' : 'SPIN'}
      </button>
    </div>
  )
}
