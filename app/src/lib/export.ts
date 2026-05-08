import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { rotateImageToBlob } from './rotate'
import type { Sticker } from '@/store'

const OUT_FOLDER = 'stickers-rotated'
const CONCURRENCY = 6

async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  const out: U[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}

export async function exportZip(
  stickers: Sticker[],
  onProgress?: (done: number, total: number) => void
) {
  const zip = new JSZip()
  const folder = zip.folder(OUT_FOLDER)
  if (!folder) throw new Error('Failed to create zip folder')

  let done = 0
  await mapWithConcurrency(stickers, CONCURRENCY, async (s) => {
    const blob = await rotateImageToBlob(s.file, s.angle)
    folder.file(s.name, blob)
    done++
    onProgress?.(done, stickers.length)
  })

  const archive = await zip.generateAsync({ type: 'blob' })
  saveAs(archive, `${OUT_FOLDER}.zip`)
}
