import { create } from 'zustand'
import { toast } from 'sonner'
import { normalizeAngle } from '@/lib/angle'
import { mapWithConcurrency } from '@/lib/concurrency'
import { probeImagePixelSize } from '@/lib/image-probe'
import {
  computeMmPerPx,
  readJsonFile,
  type MetadataSource,
  type StickerMeta,
} from '@/lib/sticker-metadata'

export type ImageItem = {
  id: string
  name: string
  file: File
  previewUrl: string
  angle: number
  origPx?: { width: number; height: number }
  metadata?: StickerMeta
}

type IngestMetaResult = {
  filesParsed: number
  filesFailed: number
  stickersAdded: number
  stickersReplaced: number
  matchedExisting: number
}

type State = {
  images: ImageItem[]
  columns: number
  metadataIndex: Record<string, StickerMeta>
  metadataSources: MetadataSource[]
  pendingProbes: number
  addImages: (files: File[]) => { added: number; newIds: string[] }
  setAngle: (id: string, angle: number) => void
  bumpAngle: (id: string, delta: number) => void
  setColumns: (n: number) => void
  removeImage: (id: string) => void
  resetAllAngles: () => void
  clearAll: () => void
  ingestMetadataFiles: (files: File[]) => Promise<IngestMetaResult>
  attachMetadataToAll: () => void
  setImagePixelSize: (id: string, width: number, height: number) => void
  probeNewImages: (ids: string[]) => Promise<void>
  clearMetadata: () => void
}

const dedupKey = (f: File) => `${f.name}::${f.size}`
const nameKey = (name: string) => name.toLowerCase()

function enrichWithPx(
  meta: StickerMeta,
  origPx: { width: number; height: number } | undefined
): StickerMeta {
  if (!origPx) return meta
  return {
    ...meta,
    mmPerPx: computeMmPerPx(meta.png_size_mm, origPx.width, origPx.height),
  }
}

export const useStore = create<State>((set, get) => ({
  images: [],
  columns: 6,
  metadataIndex: {},
  metadataSources: [],
  pendingProbes: 0,

  setColumns: (n) => set({ columns: n }),

  addImages: (files) => {
    const existing = new Set(get().images.map((s) => dedupKey(s.file)))
    const fresh: ImageItem[] = []
    const index = get().metadataIndex
    for (const file of files) {
      if (existing.has(dedupKey(file))) continue
      existing.add(dedupKey(file))
      const meta = index[nameKey(file.name)]
      fresh.push({
        id: crypto.randomUUID(),
        name: file.name,
        file,
        previewUrl: URL.createObjectURL(file),
        angle: 0,
        metadata: meta,
      })
    }
    if (fresh.length === 0) return { added: 0, newIds: [] }
    set({ images: [...get().images, ...fresh] })
    return { added: fresh.length, newIds: fresh.map((f) => f.id) }
  },

  setAngle: (id, angle) => {
    set({
      images: get().images.map((s) =>
        s.id === id ? { ...s, angle: normalizeAngle(angle) } : s
      ),
    })
  },

  bumpAngle: (id, delta) => {
    set({
      images: get().images.map((s) =>
        s.id === id
          ? { ...s, angle: normalizeAngle(s.angle + delta) }
          : s
      ),
    })
  },

  removeImage: (id) => {
    const target = get().images.find((s) => s.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)
    set({ images: get().images.filter((s) => s.id !== id) })
  },

  resetAllAngles: () => {
    set({ images: get().images.map((s) => ({ ...s, angle: 0 })) })
  },

  clearAll: () => {
    for (const s of get().images) URL.revokeObjectURL(s.previewUrl)
    set({
      images: [],
      metadataIndex: {},
      metadataSources: [],
      pendingProbes: 0,
    })
  },

  clearMetadata: () => {
    set({
      metadataIndex: {},
      metadataSources: [],
      images: get().images.map((s) => ({ ...s, metadata: undefined })),
    })
  },

  ingestMetadataFiles: async (files) => {
    let filesParsed = 0
    let filesFailed = 0
    let stickersAdded = 0
    let stickersReplaced = 0
    const newSources: MetadataSource[] = []
    const newIndexEntries: Record<string, StickerMeta> = {}

    for (const f of files) {
      try {
        const parsed = await readJsonFile(f)
        filesParsed++
        const sourceId = crypto.randomUUID()
        newSources.push({
          id: sourceId,
          fileName: f.name,
          document: parsed.document,
          exported_at: parsed.exported_at,
          settings: parsed.settings,
          loadedAt: Date.now(),
        })
        for (const entry of parsed.stickers) {
          newIndexEntries[nameKey(entry.file)] = {
            file: entry.file,
            cut_size_mm: entry.cut_size_mm,
            with_white_outline_mm: entry.with_white_outline_mm,
            png_size_mm: entry.png_size_mm,
            sourceId,
          }
        }
      } catch (e) {
        filesFailed++
        toast.error(
          `Не удалось загрузить ${f.name}: ${e instanceof Error ? e.message : 'unknown'}`
        )
      }
    }

    if (filesParsed === 0) {
      return {
        filesParsed,
        filesFailed,
        stickersAdded: 0,
        stickersReplaced: 0,
        matchedExisting: 0,
      }
    }

    const existingIndex = get().metadataIndex
    for (const k of Object.keys(newIndexEntries)) {
      if (existingIndex[k]) stickersReplaced++
      else stickersAdded++
    }

    const mergedIndex: Record<string, StickerMeta> = {
      ...existingIndex,
      ...newIndexEntries,
    }

    set({
      metadataIndex: mergedIndex,
      metadataSources: [...get().metadataSources, ...newSources],
    })

    let matchedExisting = 0
    set({
      images: get().images.map((img) => {
        const next = mergedIndex[nameKey(img.name)]
        if (!next) return img
        const enriched = enrichWithPx(next, img.origPx)
        if (img.metadata?.file !== enriched.file) matchedExisting++
        return { ...img, metadata: enriched }
      }),
    })

    return {
      filesParsed,
      filesFailed,
      stickersAdded,
      stickersReplaced,
      matchedExisting,
    }
  },

  attachMetadataToAll: () => {
    const index = get().metadataIndex
    set({
      images: get().images.map((img) => {
        const meta = index[nameKey(img.name)]
        if (!meta) return img.metadata ? { ...img, metadata: undefined } : img
        return { ...img, metadata: enrichWithPx(meta, img.origPx) }
      }),
    })
  },

  setImagePixelSize: (id, width, height) => {
    set({
      images: get().images.map((img) => {
        if (img.id !== id) return img
        const origPx = { width, height }
        const metadata = img.metadata
          ? enrichWithPx(img.metadata, origPx)
          : img.metadata
        return { ...img, origPx, metadata }
      }),
    })
  },

  probeNewImages: async (ids) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const targets = get().images.filter((img) => idSet.has(img.id))
    set({ pendingProbes: get().pendingProbes + targets.length })
    try {
      await mapWithConcurrency(targets, 6, async (img) => {
        try {
          const { width, height } = await probeImagePixelSize(img.file)
          get().setImagePixelSize(img.id, width, height)
        } catch (e) {
          console.warn(
            `[probe] failed for ${img.name}: ${e instanceof Error ? e.message : 'unknown'}`
          )
        } finally {
          set({ pendingProbes: Math.max(0, get().pendingProbes - 1) })
        }
      })
    } catch (e) {
      console.warn('[probeNewImages]', e)
    }
  },
}))
