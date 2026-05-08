import { useStore } from '@/store'
import { StickerCard } from './StickerCard'

export function StickerGrid() {
  const stickers = useStore((s) => s.stickers)
  const columns = useStore((s) => s.columns)

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {stickers.map((s) => (
        <StickerCard key={s.id} sticker={s} />
      ))}
    </div>
  )
}
