export type ShapeType = 'circle' | 'rect' | 'path' | 'polygon'

export interface CircleShape {
  type: 'circle'
  cx: number
  cy: number
  r: number
}

export interface RectShape {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
  rx?: number
}

export interface PathShape {
  type: 'path'
  d: string
}

export interface PolygonShape {
  type: 'polygon'
  points: string
}

export type HatchShape = CircleShape | RectShape | PathShape | PolygonShape

export interface CrossHatchOptions {
  shape: HatchShape
  lightDirection?: [number, number]
  hatchSpacing?: number
  lineWidth?: number
  hatchAngles?: number[]
  randomness?: number
  shadowIntensity?: number
  layers?: number
  width: number
  height: number
  strokeColor?: string
  highlightRegion?: number
  seed?: number
  id?: string
}

export interface HatchLine {
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

export interface SvgElements {
  defs: string
  content: string
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function normalizeLight(dir: [number, number]): [number, number] {
  const len = Math.hypot(dir[0], dir[1]) || 1
  return [dir[0] / len, dir[1] / len]
}

function shapeElement(shape: HatchShape): string {
  switch (shape.type) {
    case 'circle':
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" />`
    case 'rect':
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.rx ?? 0}" />`
    case 'path':
      return `<path d="${shape.d}" />`
    case 'polygon':
      return `<polygon points="${shape.points}" />`
  }
}

function shapeCenter(shape: HatchShape): [number, number] {
  switch (shape.type) {
    case 'circle':
      return [shape.cx, shape.cy]
    case 'rect':
      return [shape.x + shape.width / 2, shape.y + shape.height / 2]
    case 'path':
    case 'polygon':
      return [0, 0]
  }
}

const DEFAULT_ANGLES = [45, -45, 0, 90]
const MAX_LINES = 380

export class CrossHatchShader {
  private opts: Required<Omit<CrossHatchOptions, 'id' | 'hatchAngles'>> & {
    hatchAngles: number[]
    id: string
  }

  constructor(options: CrossHatchOptions) {
    const layers = options.layers ?? 4
    const hatchAngles = options.hatchAngles ?? DEFAULT_ANGLES.slice(0, layers)

    this.opts = {
      shape: options.shape,
      lightDirection: options.lightDirection ?? [-1, -1],
      hatchSpacing: options.hatchSpacing ?? 6,
      lineWidth: options.lineWidth ?? 1.2,
      hatchAngles,
      randomness: options.randomness ?? 0.3,
      shadowIntensity: options.shadowIntensity ?? 0.4,
      layers,
      width: options.width,
      height: options.height,
      strokeColor: options.strokeColor ?? '#011C40',
      highlightRegion: options.highlightRegion ?? 0.35,
      seed: options.seed ?? 42,
      id: options.id ?? `crosshatch-${Math.random().toString(36).slice(2, 9)}`,
    }
  }

  private densityAt(x: number, y: number): number {
    const [lx, ly] = normalizeLight(this.opts.lightDirection)
    const [cx, cy] = shapeCenter(this.opts.shape)
    const dx = x - cx
    const dy = y - cy
    const dot = dx * lx + dy * ly
    const maxDist = Math.hypot(this.opts.width, this.opts.height) / 2
    const normalized = (dot / maxDist + 1) / 2
    const shadow = 1 - normalized
    return Math.max(0, Math.min(1, shadow * (1 - this.opts.highlightRegion * normalized)))
  }

  private generateLayerLines(angleDeg: number, layerIndex: number, rand: () => number): HatchLine[] {
    const { width, height, hatchSpacing, randomness } = this.opts
    const angle = (angleDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const diagonal = Math.hypot(width, height)
    const lines: HatchLine[] = []
    const layerFactor = 1 + layerIndex * 0.15

    for (let i = -diagonal; i < diagonal; i += hatchSpacing * layerFactor) {
      const jitter = (rand() - 0.5) * hatchSpacing * randomness
      const offset = i + jitter

      const x1 = offset * cos - diagonal * sin
      const y1 = offset * sin + diagonal * cos
      const x2 = offset * cos + diagonal * sin
      const y2 = offset * sin - diagonal * cos

      const midX = (x1 + x2) / 2 + width / 2
      const midY = (y1 + y2) / 2 + height / 2
      const density = this.densityAt(midX, midY)

      if (density < 0.08) continue

      const lengthJitter = 1 - rand() * randomness * 0.4
      const opacity = 0.15 + density * 0.45 + rand() * 0.08

      lines.push({
        x1: x1 + width / 2,
        y1: y1 + height / 2,
        x2: x1 + width / 2 + (x2 - x1) * lengthJitter,
        y2: y1 + height / 2 + (y2 - y1) * lengthJitter,
        opacity: Math.min(0.65, opacity),
      })

      if (lines.length >= MAX_LINES) return lines
    }

    return lines
  }

  private generateShadowLines(rand: () => number): HatchLine[] {
    const { shadowIntensity, shape } = this.opts
    if (shadowIntensity <= 0) return []

    const lines: HatchLine[] = []
    const count = Math.floor(6 + shadowIntensity * 10)
    const [lx, ly] = normalizeLight(this.opts.lightDirection)
    const [cx, cy] = shapeCenter(shape)

    for (let i = 0; i < count; i++) {
      const spread = 20 + rand() * 40
      const startX = cx - lx * spread + (rand() - 0.5) * 30
      const startY = cy - ly * spread + (rand() - 0.5) * 30
      const len = 8 + rand() * 25
      const angle = Math.atan2(ly, lx) + (rand() - 0.5) * 0.8

      lines.push({
        x1: startX,
        y1: startY,
        x2: startX + Math.cos(angle) * len,
        y2: startY + Math.sin(angle) * len,
        opacity: 0.12 + rand() * 0.2 * shadowIntensity,
      })
    }

    return lines
  }

  generateLines(): HatchLine[] {
    const rand = seededRandom(this.opts.seed)
    const allLines: HatchLine[] = []

    for (let i = 0; i < this.opts.layers; i++) {
      const angle = this.opts.hatchAngles[i] ?? DEFAULT_ANGLES[i] ?? 45
      allLines.push(...this.generateLayerLines(angle, i, rand))
      if (allLines.length >= MAX_LINES) break
    }

    allLines.push(...this.generateShadowLines(rand))
    return allLines.slice(0, MAX_LINES)
  }

  toSvgElements(): SvgElements {
    const { id, shape, width, height, lineWidth, strokeColor } = this.opts
    const lines = this.generateLines()
    const clipId = `${id}-clip`

    const defs = `
      <clipPath id="${clipId}">
        ${shapeElement(shape)}
      </clipPath>
    `

    const lineElements = lines
      .map(
        (l) =>
          `<line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" stroke="${strokeColor}" stroke-width="${lineWidth}" stroke-linecap="round" opacity="${l.opacity.toFixed(3)}" />`,
      )
      .join('\n')

    const highlightId = `${id}-highlight`
    const [lx, ly] = normalizeLight(this.opts.lightDirection)
    const hx = width / 2 + lx * width * 0.2
    const hy = height / 2 + ly * height * 0.2

    const content = `
      <defs>
        <radialGradient id="${highlightId}" cx="${hx / width}" cy="${hy / height}" r="0.45">
          <stop offset="0%" stop-color="#A7EBF2" stop-opacity="0.18" />
          <stop offset="60%" stop-color="#54ACBF" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#011C40" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${shapeElement(shape).replace('/>', ` fill="url(#${highlightId})" />`)}
      <g clip-path="url(#${clipId})">
        ${lineElements}
      </g>
    `

    return { defs, content }
  }
}
