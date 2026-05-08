import { Dropzone } from '@/components/Dropzone'
import { ImageGrid } from '@/components/ImageGrid'
import { Toolbar } from '@/components/Toolbar'
import { Toaster } from '@/components/ui/sonner'
import { useStore } from '@/store'

export default function App() {
  const hasImages = useStore((s) => s.images.length > 0)

  return (
    <div className="dark flex h-screen flex-col bg-background text-foreground">
      <Toolbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
        {hasImages ? <ImageGrid /> : <Dropzone />}
      </main>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
