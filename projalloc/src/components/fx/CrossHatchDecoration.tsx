import { cn } from '@/lib/utils'
import { CrossHatchShaderSvg, type HatchShape } from './CrossHatchShader'

interface CrossHatchDecorationProps {
  shape?: HatchShape
  width?: number
  height?: number
  className?: string
  variant?: 'circle' | 'rect' | 'badge'
  seed?: number
}

const VARIANTS: Record<
  NonNullable<CrossHatchDecorationProps['variant']>,
  { shape: HatchShape; width: number; height: number }
> = {
  circle: {
    shape: { type: 'circle', cx: 60, cy: 60, r: 55 },
    width: 120,
    height: 120,
  },
  rect: {
    shape: { type: 'rect', x: 4, y: 4, width: 112, height: 72, rx: 4 },
    width: 120,
    height: 80,
  },
  badge: {
    shape: { type: 'circle', cx: 24, cy: 24, r: 22 },
    width: 48,
    height: 48,
  },
}

export function CrossHatchDecoration({
  shape,
  width,
  height,
  className,
  variant = 'circle',
  seed = 7,
}: CrossHatchDecorationProps) {
  const preset = VARIANTS[variant]
  const finalShape = shape ?? preset.shape
  const w = width ?? preset.width
  const h = height ?? preset.height

  return (
    <div className={cn('pointer-events-none select-none', className)} aria-hidden>
      <CrossHatchShaderSvg
        shape={finalShape}
        width={w}
        height={h}
        lightDirection={[-1, -1]}
        hatchSpacing={5}
        lineWidth={1.1}
        randomness={0.35}
        shadowIntensity={0.35}
        layers={3}
        seed={seed}
        strokeColor="#011C40"
        highlightRegion={0.4}
      />
    </div>
  )
}
