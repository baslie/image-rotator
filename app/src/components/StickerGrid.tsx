import { useStore } from '@/store'
import { StickerCard } from './StickerCard'

export function StickerGrid() {
  const stickers = useStore((s) => s.stickers)

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      }}
    >
      {stickers.map((s) => (
        <StickerCard key={s.id} sticker={s} />
      ))}
    </div>
  )
}
