export type Dimension2D = { width: number; height: number }

export type StickerEntry = {
  file: string
  cut_size_mm: Dimension2D
  with_white_outline_mm: Dimension2D
  png_size_mm: Dimension2D
  angle_deg?: number
}

export type StickerSettings = {
  white_outline_mm: number
  padding_mm: number
  export_scale_percent: number
}

export type StickerMetadataFile = {
  document: string
  exported_at: string
  settings: StickerSettings
  stickers: StickerEntry[]
}

export type MetadataSource = {
  id: string
  fileName: string
  document: string
  exported_at: string
  settings: StickerSettings
  loadedAt: number
}

export type StickerMeta = {
  file: string
  cut_size_mm: Dimension2D
  with_white_outline_mm: Dimension2D
  png_size_mm: Dimension2D
  sourceId: string
  mmPerPx?: number
}

const ANISOTROPY_THRESHOLD = 0.01

function isDimension(value: unknown): value is Dimension2D {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.width === 'number' && typeof v.height === 'number'
}

function isStickerEntry(value: unknown): value is StickerEntry {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.file === 'string' &&
    isDimension(v.png_size_mm) &&
    (v.cut_size_mm === undefined || isDimension(v.cut_size_mm)) &&
    (v.with_white_outline_mm === undefined || isDimension(v.with_white_outline_mm))
  )
}

function isMetadataFile(value: unknown): value is StickerMetadataFile {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.stickers)) return false
  return v.stickers.every(isStickerEntry)
}

export function parseStickerMetadataText(text: string): StickerMetadataFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(
      `Не удалось распарсить JSON: ${e instanceof Error ? e.message : 'unknown'}`,
      { cause: e }
    )
  }
  if (!isMetadataFile(parsed)) {
    throw new Error(
      'JSON не соответствует формату sizes.json (нужен массив stickers c file и png_size_mm)'
    )
  }
  return {
    document: typeof parsed.document === 'string' ? parsed.document : '',
    exported_at:
      typeof parsed.exported_at === 'string' ? parsed.exported_at : '',
    settings: normalizeSettings(parsed.settings),
    stickers: parsed.stickers.map(normalizeEntry),
  }
}

function normalizeSettings(s: unknown): StickerSettings {
  const fallback: StickerSettings = {
    white_outline_mm: 2.5,
    padding_mm: 1.0,
    export_scale_percent: 200,
  }
  if (!s || typeof s !== 'object') return fallback
  const v = s as Record<string, unknown>
  return {
    white_outline_mm:
      typeof v.white_outline_mm === 'number'
        ? v.white_outline_mm
        : fallback.white_outline_mm,
    padding_mm:
      typeof v.padding_mm === 'number' ? v.padding_mm : fallback.padding_mm,
    export_scale_percent:
      typeof v.export_scale_percent === 'number'
        ? v.export_scale_percent
        : fallback.export_scale_percent,
  }
}

function normalizeEntry(e: StickerEntry): StickerEntry {
  return {
    file: e.file,
    cut_size_mm: e.cut_size_mm ?? e.png_size_mm,
    with_white_outline_mm: e.with_white_outline_mm ?? e.png_size_mm,
    png_size_mm: e.png_size_mm,
  }
}

export function isJsonFile(f: File): boolean {
  if (f.type === 'application/json') return true
  return f.name.toLowerCase().endsWith('.json')
}

export function isPngFile(f: File): boolean {
  if (f.type === 'image/png') return true
  return f.name.toLowerCase().endsWith('.png')
}

export function splitPngAndJson(files: File[]): {
  png: File[]
  json: File[]
  skipped: string[]
} {
  const png: File[] = []
  const json: File[] = []
  const skipped: string[] = []
  for (const f of files) {
    if (isPngFile(f)) png.push(f)
    else if (isJsonFile(f)) json.push(f)
    else skipped.push(f.name)
  }
  return { png, json, skipped }
}

export async function readJsonFile(f: File): Promise<StickerMetadataFile> {
  const text = await f.text()
  return parseStickerMetadataText(text)
}

export function computeMmPerPx(
  png_size_mm: Dimension2D,
  pxW: number,
  pxH: number
): number {
  const mmW = png_size_mm.width / pxW
  const mmH = png_size_mm.height / pxH
  const avg = (mmW + mmH) / 2
  if (avg > 0 && Math.abs(mmW - mmH) / avg > ANISOTROPY_THRESHOLD) {
    console.warn(
      `[sticker-metadata] anisotropic mm/px: x=${mmW.toFixed(4)} y=${mmH.toFixed(4)} (>1% diff)`
    )
  }
  return avg
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

export function recomputePngSizeMm(
  finalPxW: number,
  finalPxH: number,
  mmPerPx: number
): Dimension2D {
  return {
    width: round1(finalPxW * mmPerPx),
    height: round1(finalPxH * mmPerPx),
  }
}

export function predictedRotatedMm(
  dim: Dimension2D,
  angleDeg: number
): Dimension2D {
  const rad = (angleDeg * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  return {
    width: round1(dim.width * cos + dim.height * sin),
    height: round1(dim.width * sin + dim.height * cos),
  }
}

export function formatMm(d: Dimension2D): string {
  return `${d.width.toFixed(1)}×${d.height.toFixed(1)} мм`
}

export function formatNowIsoSeconds(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}
