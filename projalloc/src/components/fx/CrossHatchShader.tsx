import { useId, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  CrossHatchShader,
  type CrossHatchOptions,
  type HatchShape,
} from '@/lib/crossHatchShader'

export interface CrossHatchShaderProps extends Omit<CrossHatchOptions, 'id'> {
  className?: string
  'aria-hidden'?: boolean
}

export function CrossHatchShaderSvg({
  shape,
  lightDirection,
  hatchSpacing,
  lineWidth,
  hatchAngles,
  randomness,
  shadowIntensity,
  layers,
  width,
  height,
  strokeColor,
  highlightRegion,
  seed,
  className,
  'aria-hidden': ariaHidden = true,
}: CrossHatchShaderProps) {
  const reactId = useId()
  const safeId = reactId.replace(/:/g, '')

  const svgContent = useMemo(() => {
    const shader = new CrossHatchShader({
      shape,
      lightDirection,
      hatchSpacing,
      lineWidth,
      hatchAngles,
      randomness,
      shadowIntensity,
      layers,
      width,
      height,
      strokeColor,
      highlightRegion,
      seed,
      id: safeId,
    })
    return shader.toSvgElements()
  }, [
    shape,
    lightDirection,
    hatchSpacing,
    lineWidth,
    hatchAngles,
    randomness,
    shadowIntensity,
    layers,
    width,
    height,
    strokeColor,
    highlightRegion,
    seed,
    safeId,
  ])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      aria-hidden={ariaHidden}
    >
      <defs dangerouslySetInnerHTML={{ __html: svgContent.defs }} />
      <g dangerouslySetInnerHTML={{ __html: svgContent.content }} />
    </svg>
  )
}

export type { HatchShape, CrossHatchOptions }
export { CrossHatchShader }
