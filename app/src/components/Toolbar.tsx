import { useMemo, useState } from 'react'
import { FileJson, FolderDown, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/store'
import { exportToFolder } from '@/lib/tauri-export'
import { Dropzone } from './Dropzone'
import { ColumnSelector } from './ColumnSelector'

export function Toolbar() {
  const images = useStore((s) => s.images)
  const sources = useStore((s) => s.metadataSources)
  const metadataIndex = useStore((s) => s.metadataIndex)
  const pendingProbes = useStore((s) => s.pendingProbes)
  const resetAll = useStore((s) => s.resetAllAngles)
  const clearAll = useStore((s) => s.clearAll)
  const columns = useStore((s) => s.columns)
  const setColumns = useStore((s) => s.setColumns)
  const [busy, setBusy] = useState(false)

  const count = images.length
  const rotatedCount = images.filter((s) => s.angle !== 0).length

  const matchedCount = useMemo(
    () => images.filter((s) => s.metadata).length,
    [images]
  )
  const totalEntries = Object.keys(metadataIndex).length
  const orphanEntries = useMemo(() => {
    const names = new Set(images.map((i) => i.name.toLowerCase()))
    return Object.values(metadataIndex)
      .filter((m) => !names.has(m.file.toLowerCase()))
      .map((m) => m.file)
  }, [images, metadataIndex])

  const onExport = async () => {
    if (count === 0) {
      toast.info('Сначала загрузите изображения')
      return
    }
    if (pendingProbes > 0) {
      toast.info('Подождите, идёт обработка метаданных…')
      return
    }
    setBusy(true)
    const id = toast.loading(`Готовлю ${count} изображений… 0/${count}`)
    try {
      const onProgress = (done: number, total: number) =>
        toast.loading(`Готовлю изображения… ${done}/${total}`, { id })
      const result = await exportToFolder(images, sources, onProgress)
      if (result.cancelled) {
        toast.dismiss(id)
        return
      }
      const extra = result.jsonWritten ? ' · sizes.json создан' : ''
      toast.success(`Сохранено ${result.count} в ${result.path}${extra}`, {
        id,
      })
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

        <MetadataStatus
          sourcesCount={sources.length}
          totalEntries={totalEntries}
          matchedCount={matchedCount}
          imagesCount={count}
          orphanFiles={orphanEntries}
          pendingProbes={pendingProbes}
        />

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

          <Button
            onClick={onExport}
            disabled={busy || count === 0 || pendingProbes > 0}
          >
            <FolderDown className="size-4" />
            Экспорт в папку
          </Button>
        </div>
      </div>
    </header>
  )
}

type StatusProps = {
  sourcesCount: number
  totalEntries: number
  matchedCount: number
  imagesCount: number
  orphanFiles: string[]
  pendingProbes: number
}

function MetadataStatus({
  sourcesCount,
  totalEntries,
  matchedCount,
  imagesCount,
  orphanFiles,
  pendingProbes,
}: StatusProps) {
  if (sourcesCount === 0) {
    return (
      <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        sizes.json не загружен
      </span>
    )
  }
  const fullyMatched = imagesCount > 0 && matchedCount === imagesCount
  const partial = imagesCount > 0 && matchedCount < imagesCount
  const dotClass = fullyMatched
    ? 'bg-emerald-500'
    : partial
      ? 'bg-amber-500'
      : 'bg-sky-500'

  const label =
    imagesCount > 0
      ? `sizes.json · ${matchedCount}/${imagesCount} сопоставлено`
      : `sizes.json · ${totalEntries} записей`

  const tooltip = (
    <div className="max-w-xs space-y-1">
      <p>
        Источников: {sourcesCount} · записей: {totalEntries}
      </p>
      {imagesCount > 0 && (
        <p>
          PNG сопоставлено: {matchedCount}/{imagesCount}
          {partial && ` (${imagesCount - matchedCount} без metadata)`}
        </p>
      )}
      {orphanFiles.length > 0 && (
        <p className="text-muted-foreground">
          {orphanFiles.length} записей без PNG:{' '}
          {orphanFiles.slice(0, 5).join(', ')}
          {orphanFiles.length > 5 ? '…' : ''}
        </p>
      )}
      {pendingProbes > 0 && (
        <p className="text-amber-500">
          Идёт обработка PNG: {pendingProbes}
        </p>
      )}
    </div>
  )

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <FileJson className="size-3.5" />
            <span className={`size-1.5 rounded-full ${dotClass}`} />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
