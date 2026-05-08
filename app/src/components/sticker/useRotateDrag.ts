import { useRef, useState } from 'react'
import type React from 'react'

function angleFromPointer(
  clientX: number,
  clientY: number,
  cx: number,
  cy: number
) {
  return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
}

type Options = {
  angle: number
  onChange: (deg: number) => void
  snap: (deg: number) => number
}

type Handlers = {
  onPointerDown: React.PointerEventHandler<HTMLDivElement>
  onPointerMove: React.PointerEventHandler<HTMLDivElement>
  onPointerUp: React.PointerEventHandler<HTMLDivElement>
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>
}

export function useRotateDrag({ angle, onChange, snap }: Options): {
  handlers: Handlers
  dragging: boolean
  snapHit: boolean
} {
  const dragRef = useRef<{
    cx: number
    cy: number
    startPointer: number
    startAngle: number
    snapped: boolean
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [snapHit, setSnapHit] = useState(false)

  const onPointerDown: Handlers['onPointerDown'] = (e) => {
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
      startAngle: angle,
      snapped: false,
    }
    setDragging(true)
  }

  const onPointerMove: Handlers['onPointerMove'] = (e) => {
    const drag = dragRef.current
    if (!drag) return
    const cur = angleFromPointer(e.clientX, e.clientY, drag.cx, drag.cy)
    const raw = drag.startAngle + (cur - drag.startPointer)
    const snapped = snap(raw)
    const isSnapped = snapped !== raw
    if (isSnapped !== drag.snapped) {
      drag.snapped = isSnapped
      setSnapHit(isSnapped)
    }
    onChange(snapped)
  }

  const onPointerEnd: Handlers['onPointerUp'] = (e) => {
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

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
    dragging,
    snapHit,
  }
}
