import { memo, useRef, useState } from 'react'
import { Hand, RotateCcw, RotateCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useStore, type Sticker } from '@/store'
import { cn } from '@/lib/utils'

type Props = { sticker: Sticker }

const SNAP_TARGETS = [0, 90, 180, 270, 360]
const SNAP_THRESHOLD = 6
const SNAP_MARKS = [0, 90, 180, 270]

function snapAngle(angle: number): number {
  for (const t of SNAP_TARGETS) {
    if (Math.abs(angle - t) <= SNAP_THRESHOLD) return t
  }
  return angle
}

function angleFromPointer(
  clientX: number,
  clientY: number,
  cx: number,
  cy: number
) {
  return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
}

function StickerCardImpl({ sticker }: Props) {
  const setAngle = useStore((s) => s.setAngle)
  const bumpAngle = useStore((s) => s.bumpAngle)
  const removeSticker = useStore((s) => s.removeSticker)

  const dragRef = useRef<{
    cx: number
    cy: number
    startPointer: number
    startAngle: number
    snapped: boolean
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [snapHit, setSnapHit] = useState(false)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // No-op: capture не критичен для базового drag
    }
    dragRef.current = {
      cx,
      cy,
      startPointer: angleFromPointer(e.clientX, e.clientY, cx, cy),
      startAngle: sticker.angle,
      snapped: false,
    }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const cur = angleFromPointer(e.clientX, e.clientY, drag.cx, drag.cy)
    const raw = drag.startAngle + (cur - drag.startPointer)
    const snapped = snapAngle(raw)
    const isSnapped = snapped !== raw
    if (isSnapped !== drag.snapped) {
      drag.snapped = isSnapped
      setSnapHit(isSnapped)
    }
    setAngle(sticker.id, snapped)
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // No-op
    }
    dragRef.current = null
    setDragging(false)
    setSnapHit(false)
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 backdrop-blur transition-colors hover:bg-card">
      <div className="checker-bg relative aspect-square overflow-hidden rounded-lg">
        <img
          src={sticker.previewUrl}
          alt={sticker.name}
          draggable={false}
          className="absolute inset-0 m-auto h-full w-full select-none object-contain p-2 transition-transform duration-100 ease-out"
          style={{ transform: `rotate(${sticker.angle}deg)` }}
        />

        {/* Drag-rotation overlay */}
        <div
          role="slider"
          aria-label="Перетащить для поворота"
          aria-valuenow={Math.round(sticker.angle)}
          aria-valuemin={0}
          aria-valuemax={360}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDoubleClick={() => setAngle(sticker.id, 0)}
          className={cn(
            'absolute inset-0 touch-none select-none',
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          {/* Hand hint при наведении */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity',
              dragging
                ? 'opacity-90'
                : 'opacity-0 group-hover:opacity-70'
            )}
          >
            <div className="rounded-full bg-background/40 p-2 backdrop-blur-sm">
              <Hand className="size-6 text-foreground drop-shadow" />
            </div>
          </div>

          {/* Snap-индикатор: вспышка кольцом, когда thumb прилип к якорю */}
          <div
            className={cn(
              'pointer-events-none absolute inset-1 rounded-md ring-2 ring-primary transition-opacity duration-150',
              snapHit ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => removeSticker(sticker.id)}
          className="absolute right-1.5 top-1.5 z-10 inline-flex size-6 items-center justify-center rounded-full bg-background/70 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Удалить"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-1">
        <Slider
          value={[sticker.angle]}
          min={0}
          max={360}
          step={1}
          snapMarks={SNAP_MARKS}
          onValueChange={(v) => setAngle(sticker.id, snapAngle(v[0] ?? 0))}
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {Math.round(sticker.angle)}°
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setAngle(sticker.id, 0)}
          disabled={sticker.angle === 0}
          aria-label="Сбросить"
          title="Сбросить угол"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 flex-1 gap-2"
          onClick={() => bumpAngle(sticker.id, 90)}
          aria-label="Повернуть на 90 градусов по часовой стрелке"
          title="+90° по часовой"
        >
          <RotateCw className="size-4" />
          Повернуть 90°
        </Button>
      </div>

      <p className="truncate text-xs text-muted-foreground" title={sticker.name}>
        {sticker.name}
      </p>
    </div>
  )
}

export const StickerCard = memo(StickerCardImpl)
