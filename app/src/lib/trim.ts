const ALPHA_THRESHOLD = 5

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement
type AnyCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D

function createCanvas(w: number, h: number): { canvas: AnyCanvas; ctx: AnyCtx } {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable')
    return { canvas, ctx: ctx as AnyCtx }
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d context unavailable')
  return { canvas, ctx }
}

async function canvasToPngBlob(canvas: AnyCanvas): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return await canvas.convertToBlob({ type: 'image/png' })
  }
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    )
  })
}

export async function trimTransparentEdges(
  blob: Blob,
  padding: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const w = bitmap.width
  const h = bitmap.height

  const measure = createCanvas(w, h)
  measure.ctx.drawImage(bitmap, 0, 0)
  const data = measure.ctx.getImageData(0, 0, w, h).data

  let top = -1
  for (let y = 0; y < h && top === -1; y++) {
    const rowStart = y * w * 4
    for (let x = 0; x < w; x++) {
      if (data[rowStart + x * 4 + 3] > ALPHA_THRESHOLD) {
        top = y
        break
      }
    }
  }

  if (top === -1) {
    bitmap.close()
    return blob
  }

  let bottom = h - 1
  for (let y = h - 1; y >= top; y--) {
    const rowStart = y * w * 4
    let found = false
    for (let x = 0; x < w; x++) {
      if (data[rowStart + x * 4 + 3] > ALPHA_THRESHOLD) {
        found = true
        break
      }
    }
    if (found) {
      bottom = y
      break
    }
  }

  let left = w - 1
  outerLeft: for (let x = 0; x < w; x++) {
    for (let y = top; y <= bottom; y++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
        left = x
        break outerLeft
      }
    }
  }

  let right = left
  outerRight: for (let x = w - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
        right = x
        break outerRight
      }
    }
  }

  const pad = Math.max(0, Math.floor(padding))
  const x0 = Math.max(0, left - pad)
  const y0 = Math.max(0, top - pad)
  const x1 = Math.min(w - 1, right + pad)
  const y1 = Math.min(h - 1, bottom + pad)

  if (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1) {
    bitmap.close()
    return blob
  }

  const cw = x1 - x0 + 1
  const ch = y1 - y0 + 1
  const out = createCanvas(cw, ch)
  out.ctx.drawImage(bitmap, x0, y0, cw, ch, 0, 0, cw, ch)
  bitmap.close()

  return await canvasToPngBlob(out.canvas)
}
