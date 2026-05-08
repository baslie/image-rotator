import { memo } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useStore, type Sticker } from '@/store'

type Props = { sticker: Sticker }

const PRESETS = [90, 180, 270] as const

function StickerCardImpl({ sticker }: Props) {
  const setAngle = useStore((s) => s.setAngle)
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

      <div className="flex items-center gap-3">
        <Slider
          value={[sticker.angle]}
          min={0}
          max={360}
          step={1}
          onValueChange={(v) => setAngle(sticker.id, v[0] ?? 0)}
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {Math.round(sticker.angle)}°
        </span>
      </div>

      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={sticker.angle === p ? 'default' : 'secondary'}
            size="sm"
            className="h-7 flex-1 px-0 text-xs"
            onClick={() => setAngle(sticker.id, p)}
          >
            {p}°
          </Button>
        ))}
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
      </div>

      <p className="truncate text-xs text-muted-foreground" title={sticker.name}>
        {sticker.name}
      </p>
    </div>
  )
}

export const StickerCard = memo(StickerCardImpl)
