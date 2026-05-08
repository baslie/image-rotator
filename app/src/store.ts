import { create } from 'zustand'
import { normalizeAngle } from '@/lib/angle'

export type ImageItem = {
  id: string
  name: string
  file: File
  previewUrl: string
  angle: number
}

type State = {
  images: ImageItem[]
  columns: number
  addImages: (files: File[]) => number
  setAngle: (id: string, angle: number) => void
  bumpAngle: (id: string, delta: number) => void
  setColumns: (n: number) => void
  removeImage: (id: string) => void
  resetAllAngles: () => void
  clearAll: () => void
}

const dedupKey = (f: File) => `${f.name}::${f.size}`

export const useStore = create<State>((set, get) => ({
  images: [],
  columns: 6,

  setColumns: (n) => set({ columns: n }),

  addImages: (files) => {
    const existing = new Set(get().images.map((s) => dedupKey(s.file)))
    const fresh: ImageItem[] = []
    for (const file of files) {
      if (existing.has(dedupKey(file))) continue
      existing.add(dedupKey(file))
      fresh.push({
        id: crypto.randomUUID(),
        name: file.name,
        file,
        previewUrl: URL.createObjectURL(file),
        angle: 0,
      })
    }
    if (fresh.length === 0) return 0
    set({ images: [...get().images, ...fresh] })
    return fresh.length
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
    set({ images: [] })
  },
}))
