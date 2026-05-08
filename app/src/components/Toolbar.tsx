import { useState } from 'react'
import { FolderDown, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { exportToFolder } from '@/lib/tauri-export'
import { Dropzone } from './Dropzone'
import { ColumnSelector } from './ColumnSelector'

export function Toolbar() {
  const images = useStore((s) => s.images)
  const resetAll = useStore((s) => s.resetAllAngles)
  const clearAll = useStore((s) => s.clearAll)
  const columns = useStore((s) => s.columns)
  const setColumns = useStore((s) => s.setColumns)
  const [busy, setBusy] = useState(false)

  const count = images.length
  const rotatedCount = images.filter((s) => s.angle !== 0).length

  const onExport = async () => {
    if (count === 0) {
      toast.info('Сначала загрузите изображения')
      return
    }
    setBusy(true)
    const id = toast.loading(`Готовлю ${count} изображений… 0/${count}`)
    try {
      const onProgress = (done: number, total: number) =>
        toast.loading(`Готовлю изображения… ${done}/${total}`, { id })
      const result = await exportToFolder(images, onProgress)
      if (result.cancelled) {
        toast.dismiss(id)
        return
      }
      toast.success(`Сохранено ${result.count} в ${result.path}`, { id })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Что-то пошло не так'
      toast.error(message, { id })
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/15 p-1.5 text-primary">
            <Sparkles className="size-4" />
          </div>
          <h1 className="text-base font-semibold">Image Rotator</h1>
        </div>

        <div className="ml-2 hidden text-sm text-muted-foreground sm:block">
          {count > 0 ? (
            <>
              <span className="font-medium text-foreground">{count}</span>{' '}
              изображений
              {rotatedCount > 0 && (
                <>
                  {' · '}
                  <span className="text-primary">{rotatedCount}</span>{' '}
                  повёрнуто
                </>
              )}
            </>
          ) : (
            <>изображения не загружены</>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {count > 0 && <Dropzone variant="compact" />}

          {count > 0 && (
            <>
              <ColumnSelector value={columns} onChange={setColumns} />

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
                  if (confirm(`Очистить ${count} изображений?`)) clearAll()
                }}
                title="Удалить все"
              >
                <Trash2 className="size-4" />
                Очистить
              </Button>
            </>
          )}

          <Button onClick={onExport} disabled={busy || count === 0}>
            <FolderDown className="size-4" />
            Экспорт в папку
          </Button>
        </div>
      </div>
    </header>
  )
}
