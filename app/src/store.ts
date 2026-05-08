import { create } from 'zustand'

export type Sticker = {
  id: string
  name: string
  file: File
  previewUrl: string
  angle: number
}

type State = {
  stickers: Sticker[]
  addStickers: (files: File[]) => number
  setAngle: (id: string, angle: number) => void
  bumpAngle: (id: string, delta: number) => void
  removeSticker: (id: string) => void
  resetAllAngles: () => void
  clearAll: () => void
}

const dedupKey = (f: File) => `${f.name}::${f.size}`

export const useStore = create<State>((set, get) => ({
  stickers: [],

  addStickers: (files) => {
    const existing = new Set(get().stickers.map((s) => dedupKey(s.file)))
    const fresh: Sticker[] = []
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
    set({ stickers: [...get().stickers, ...fresh] })
    return fresh.length
  },

  setAngle: (id, angle) => {
    set({
      stickers: get().stickers.map((s) =>
        s.id === id ? { ...s, angle: ((angle % 360) + 360) % 360 } : s
      ),
    })
  },

  bumpAngle: (id, delta) => {
    set({
      stickers: get().stickers.map((s) =>
        s.id === id
          ? { ...s, angle: (((s.angle + delta) % 360) + 360) % 360 }
          : s
      ),
    })
  },

  removeSticker: (id) => {
    const target = get().stickers.find((s) => s.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)
    set({ stickers: get().stickers.filter((s) => s.id !== id) })
  },

  resetAllAngles: () => {
    set({ stickers: get().stickers.map((s) => ({ ...s, angle: 0 })) })
  },

  clearAll: () => {
    for (const s of get().stickers) URL.revokeObjectURL(s.previewUrl)
    set({ stickers: [] })
  },
}))
