import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_CHOICES = [4, 6, 8, 10] as const

type Props = {
  value: number
  onChange: (n: number) => void
  choices?: readonly number[]
}

export function ColumnSelector({
  value,
  onChange,
  choices = DEFAULT_CHOICES,
}: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Колонок в сетке"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-secondary/40 p-0.5"
    >
      <span className="px-1.5 text-muted-foreground">
        <LayoutGrid className="size-3.5" aria-hidden />
      </span>
      {choices.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          title={`${n} колонок в строке`}
          className={cn(
            'inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 font-mono text-xs tabular-nums transition-colors',
            value === n
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
