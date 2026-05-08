import { useStore } from '@/store'
import { ImageCard } from './ImageCard'

export function ImageGrid() {
  const images = useStore((s) => s.images)
  const columns = useStore((s) => s.columns)

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {images.map((img) => (
        <ImageCard key={img.id} image={img} />
      ))}
    </div>
  )
}
