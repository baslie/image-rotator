import { memo } from 'react'
import { Hand, RotateCcw, RotateCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useStore, type ImageItem } from '@/store'
import { cn } from '@/lib/utils'
import { getRotatedFitScale } from '@/lib/angle'
import { useRotateDrag } from './image/useRotateDrag'

type Props = { image: ImageItem }

const SNAP_TARGETS = [0, 90, 180, 270]
const SNAP_THRESHOLD = 6
const SNAP_MARKS = [0, 90, 180, 270]

function snapAngle(angle: number): number {
  for (const t of SNAP_TARGETS) {
    if (Math.abs(angle - t) <= SNAP_THRESHOLD) return t
  }
  return angle
}

function ImageCardImpl({ image }: Props) {
  const setAngle = useStore((s) => s.setAngle)
  const bumpAngle = useStore((s) => s.bumpAngle)
  const removeImage = useStore((s) => s.removeImage)

  const { handlers, dragging, snapHit } = useRotateDrag({
    angle: image.angle,
    onChange: (deg) => setAngle(image.id, deg),
    snap: snapAngle,
  })

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl bg-card/60 p-3 backdrop-blur transition-colors hover:bg-card">
      <div className="checker-bg relative aspect-square overflow-hidden rounded-lg">
        <img
          src={image.previewUrl}
          alt={image.name}
          draggable={false}
          className="absolute inset-0 m-auto h-full w-full select-none object-contain p-2 transition-transform duration-100 ease-out"
          style={{
            transform: `rotate(${image.angle}deg) scale(${getRotatedFitScale(
              image.angle
            )})`,
          }}
        />

        <div
          role="slider"
          aria-label="Перетащить для поворота"
          aria-valuenow={Math.round(image.angle)}
          aria-valuemin={0}
          aria-valuemax={360}
          {...handlers}
          onDoubleClick={() => setAngle(image.id, 0)}
          className={cn(
            'absolute inset-0 touch-none select-none',
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
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

          <div
            className={cn(
              'pointer-events-none absolute inset-1 rounded-md ring-2 ring-primary transition-opacity duration-150',
              snapHit ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => removeImage(image.id)}
          className="absolute right-1.5 top-1.5 z-10 inline-flex size-6 items-center justify-center rounded-full bg-background/70 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Удалить"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-1">
        <Slider
          value={[image.angle]}
          min={0}
          max={360}
          step={1}
          snapMarks={SNAP_MARKS}
          onValueChange={(v) => setAngle(image.id, snapAngle(v[0] ?? 0))}
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {Math.round(image.angle)}°
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setAngle(image.id, 0)}
          disabled={image.angle === 0}
          aria-label="Сбросить"
          title="Сбросить угол"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 flex-1 gap-2"
          onClick={() => bumpAngle(image.id, 90)}
          aria-label="Повернуть на 90 градусов по часовой стрелке"
          title="+90° по часовой"
        >
          <RotateCw className="size-4" />
          Повернуть 90°
        </Button>
      </div>

      <p className="truncate text-xs text-muted-foreground" title={image.name}>
        {image.name}
      </p>
    </div>
  )
}

export const ImageCard = memo(ImageCardImpl)
