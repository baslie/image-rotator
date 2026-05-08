import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  snapMarks?: number[]
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, snapMarks, min = 0, max = 100, ...props }, ref) => {
  const range = max - min || 1
  return (
    <SliderPrimitive.Root
      ref={ref}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {snapMarks?.map((value) => (
        <span
          key={value}
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/60"
          style={{ left: `${((value - min) / range) * 100}%` }}
        />
      ))}
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
