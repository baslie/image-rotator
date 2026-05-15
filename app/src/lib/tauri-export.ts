import { open } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { rotateImageToBlob } from './rotate'
import { trimTransparentEdges } from './trim'
import type { ImageItem } from '@/store'

const CONCURRENCY = 6

async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  const out: U[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = cursor++
        if (i >= items.length) return
        out[i] = await fn(items[i], i)
      }
    }
  )
  await Promise.all(workers)
  return out
}

function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/'
  const trimmed = dir.endsWith('/') || dir.endsWith('\\') ? dir.slice(0, -1) : dir
  return `${trimmed}${sep}${name}`
}

export type ExportResult =
  | { cancelled: true }
  | { cancelled: false; path: string; count: number }

export async function exportToFolder(
  images: ImageItem[],
  onProgress?: (done: number, total: number) => void
): Promise<ExportResult> {
  const dir = await open({
    directory: true,
    multiple: false,
    title: 'Папка для экспорта',
  })
  if (!dir) return { cancelled: true }

  let done = 0
  await mapWithConcurrency(images, CONCURRENCY, async (img) => {
    const rotated = await rotateImageToBlob(img.file, img.angle)
    const trimmed = await trimTransparentEdges(rotated, 2)
    const bytes = new Uint8Array(await trimmed.arrayBuffer())
    await writeFile(joinPath(dir, img.name), bytes)
    done++
    onProgress?.(done, images.length)
  })

  return { cancelled: false, path: dir, count: done }
}
