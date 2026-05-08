import { memo } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useStore, type Sticker } from '@/store'

type Props = { sticker: Sticker }

const STEP_DEG = 5
const SNAP_TARGETS = [0, 90, 180, 270, 360]
const SNAP_THRESHOLD = 4
const SNAP_MARKS = [0, 90, 180, 270]

function snapAngle(angle: number): number {
  for (const t of SNAP_TARGETS) {
    if (Math.abs(angle - t) <= SNAP_THRESHOLD) return t
  }
  return angle
}

function StickerCardImpl({ sticker }: Props) {
  const setAngle = useStore((s) => s.setAngle)
  const bumpAngle = useStore((s) => s.bumpAngle)
  const removeSticker = useStore((s) => s.removeSticker)

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
        <button
          type="button"
          onClick={() => removeSticker(sticker.id)}
          className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-background/70 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
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
          variant="secondary"
          size="sm"
          className="h-7 flex-1 px-0"
          onClick={() => bumpAngle(sticker.id, -STEP_DEG)}
          aria-label={`Повернуть на ${STEP_DEG}° против часовой`}
          title={`−${STEP_DEG}°`}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setAngle(sticker.id, 0)}
          aria-label="Сбросить"
          title="Сбросить угол"
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 flex-1 px-0"
          onClick={() => bumpAngle(sticker.id, STEP_DEG)}
          aria-label={`Повернуть на ${STEP_DEG}° по часовой`}
          title={`+${STEP_DEG}°`}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="truncate text-xs text-muted-foreground" title={sticker.name}>
        {sticker.name}
      </p>
    </div>
  )
}

export const StickerCard = memo(StickerCardImpl)
