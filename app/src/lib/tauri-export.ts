import { open } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { normalizeAngle } from './angle'
import { mapWithConcurrency } from './concurrency'
import { rotateImageToBlob } from './rotate'
import { trimTransparentEdges } from './trim'
import {
  formatNowIsoSeconds,
  recomputePngSizeMm,
  type MetadataSource,
  type StickerEntry,
} from './sticker-metadata'
import type { ImageItem } from '@/store'

const CONCURRENCY = 6

function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/'
  const trimmed = dir.endsWith('/') || dir.endsWith('\\') ? dir.slice(0, -1) : dir
  return `${trimmed}${sep}${name}`
}

function pickFreshestSource(sources: MetadataSource[]): MetadataSource | null {
  if (sources.length === 0) return null
  const sorted = [...sources].sort((a, b) => {
    if (a.exported_at && b.exported_at) {
      if (a.exported_at < b.exported_at) return 1
      if (a.exported_at > b.exported_at) return -1
    }
    return b.loadedAt - a.loadedAt
  })
  return sorted[0]
}

export type ExportResult =
  | { cancelled: true }
  | {
      cancelled: false
      path: string
      count: number
      jsonWritten: boolean
    }

export async function exportToFolder(
  images: ImageItem[],
  sources: MetadataSource[],
  onProgress?: (done: number, total: number) => void
): Promise<ExportResult> {
  const dir = await open({
    directory: true,
    multiple: false,
    title: 'Папка для экспорта',
  })
  if (!dir) return { cancelled: true }

  let done = 0
  const outEntries: Array<{ index: number; entry: StickerEntry }> = []

  await mapWithConcurrency(images, CONCURRENCY, async (img, idx) => {
    const rotated = await rotateImageToBlob(img.file, img.angle)
    const { blob: trimmed, width: fw, height: fh } =
      await trimTransparentEdges(rotated, 2)
    const bytes = new Uint8Array(await trimmed.arrayBuffer())
    await writeFile(joinPath(dir, img.name), bytes)

    if (img.metadata && img.metadata.mmPerPx) {
      outEntries.push({
        index: idx,
        entry: {
          file: img.name,
          cut_size_mm: img.metadata.cut_size_mm,
          with_white_outline_mm: img.metadata.with_white_outline_mm,
          png_size_mm: recomputePngSizeMm(fw, fh, img.metadata.mmPerPx),
          angle_deg: normalizeAngle(img.angle),
        },
      })
    }

    done++
    onProgress?.(done, images.length)
  })

  let jsonWritten = false
  if (outEntries.length > 0) {
    const stickers = outEntries
      .sort((a, b) => a.index - b.index)
      .map((e) => e.entry)
    const fresh = pickFreshestSource(sources)
    const out = {
      document: fresh?.document ?? '',
      exported_at: formatNowIsoSeconds(),
      settings:
        fresh?.settings ?? {
          white_outline_mm: 2.5,
          padding_mm: 1.0,
          export_scale_percent: 200,
        },
      stickers,
    }
    const text = JSON.stringify(out, null, 2)
    const jsonBytes = new TextEncoder().encode(text)
    await writeFile(joinPath(dir, 'sizes.json'), jsonBytes)
    jsonWritten = true
  }

  return { cancelled: false, path: dir, count: done, jsonWritten }
}
