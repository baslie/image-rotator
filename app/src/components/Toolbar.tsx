import { useState } from 'react'
import { Download, FolderDown, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { exportToFolder, exportZip } from '@/lib/export'
import { useFsAccessSupport } from '@/hooks/use-fs-access'
import { Dropzone } from './Dropzone'

export function Toolbar() {
  const stickers = useStore((s) => s.stickers)
  const resetAll = useStore((s) => s.resetAllAngles)
  const clearAll = useStore((s) => s.clearAll)
  const fsSupported = useFsAccessSupport()
  const [busy, setBusy] = useState(false)

  const count = stickers.length
  const rotatedCount = stickers.filter((s) => s.angle !== 0).length

  const onExport = async (kind: 'zip' | 'folder') => {
    if (count === 0) {
      toast.info('Сначала загрузите стикеры')
      return
    }
    setBusy(true)
    const id = toast.loading(`Готовлю ${count} стикеров… 0/${count}`)
    try {
      const onProgress = (done: number, total: number) =>
        toast.loading(`Готовлю стикеры… ${done}/${total}`, { id })
      if (kind === 'zip') {
        await exportZip(stickers, onProgress)
        toast.success(`Скачан ZIP с ${count} стикерами`, { id })
      } else {
        await exportToFolder(stickers, onProgress)
        toast.success(`Сохранено в папку: ${count} стикеров`, { id })
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Что-то пошло не так'
      if (message.includes('aborted') || message.includes('user'))
        toast.dismiss(id)
      else toast.error(message, { id })
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/15 p-1.5 text-primary">
            <Sparkles className="size-4" />
          </div>
          <h1 className="text-base font-semibold">Sticker Rotator</h1>
        </div>

        <div className="ml-2 hidden text-sm text-muted-foreground sm:block">
          {count > 0 ? (
            <>
              <span className="font-medium text-foreground">{count}</span>{' '}
              стикеров
              {rotatedCount > 0 && (
                <>
                  {' · '}
                  <span className="text-primary">{rotatedCount}</span>{' '}
                  повёрнуто
                </>
              )}
            </>
          ) : (
            <>стикеры не загружены</>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {count > 0 && <Dropzone variant="compact" />}

          {count > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                disabled={rotatedCount === 0}
                title="Сбросить все углы"
              >
                <RotateCcw className="size-4" />
                Сбросить углы
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Очистить ${count} стикеров?`)) clearAll()
                }}
                title="Удалить все"
              >
                <Trash2 className="size-4" />
                Очистить
              </Button>
            </>
          )}

          <Button
            onClick={() => onExport('zip')}
            disabled={busy || count === 0}
          >
            <Download className="size-4" />
            Скачать ZIP
          </Button>
          {fsSupported && (
            <Button
              variant="secondary"
              onClick={() => onExport('folder')}
              disabled={busy || count === 0}
            >
              <FolderDown className="size-4" />
              В папку…
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
