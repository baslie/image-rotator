import { Dropzone } from '@/components/Dropzone'
import { StickerGrid } from '@/components/StickerGrid'
import { Toolbar } from '@/components/Toolbar'
import { Toaster } from '@/components/ui/sonner'
import { useStore } from '@/store'

export default function App() {
  const hasStickers = useStore((s) => s.stickers.length > 0)

  return (
    <div className="dark min-h-full bg-background text-foreground">
      <Toolbar />
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {hasStickers ? <StickerGrid /> : <Dropzone />}
      </main>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
