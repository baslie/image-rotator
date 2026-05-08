import { useState } from 'react'
import { Download, LayoutGrid, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { exportZip } from '@/lib/export'
import { cn } from '@/lib/utils'
import { Dropzone } from './Dropzone'

const COLUMN_CHOICES = [4, 6, 8, 10] as const

export function Toolbar() {
  const stickers = useStore((s) => s.stickers)
  const resetAll = useStore((s) => s.resetAllAngles)
  const clearAll = useStore((s) => s.clearAll)
  const columns = useStore((s) => s.columns)
  const setColumns = useStore((s) => s.setColumns)
  const [busy, setBusy] = useState(false)

  const count = stickers.length
  const rotatedCount = stickers.filter((s) => s.angle !== 0).length

  const onExport = async () => {
    if (count === 0) {
      toast.info('Сначала загрузите стикеры')
      return
    }
    setBusy(true)
    const id = toast.loading(`Готовлю ${count} стикеров… 0/${count}`)
    try {
      const onProgress = (done: number, total: number) =>
        toast.loading(`Готовлю стикеры… ${done}/${total}`, { id })
      await exportZip(stickers, onProgress)
      toast.success(`Скачан ZIP с ${count} стикерами`, { id })
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
              <div
                role="radiogroup"
                aria-label="Колонок в сетке"
                className="inline-flex items-center gap-0.5 rounded-md border border-border bg-secondary/40 p-0.5"
              >
                <span className="px-1.5 text-muted-foreground">
                  <LayoutGrid className="size-3.5" aria-hidden />
                </span>
                {COLUMN_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={columns === n}
                    onClick={() => setColumns(n)}
                    title={`${n} колонок в строке`}
                    className={cn(
                      'inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 font-mono text-xs tabular-nums transition-colors',
                      columns === n
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>

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

          <Button onClick={onExport} disabled={busy || count === 0}>
            <Download className="size-4" />
            Скачать ZIP
          </Button>
        </div>
      </div>
    </header>
  )
}
