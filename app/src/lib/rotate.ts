import { normalizeAngle } from './angle'

type Rotatable = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function getRotatedSize(w: number, h: number, rad: number) {
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  return {
    w: Math.ceil(w * cos + h * sin),
    h: Math.ceil(w * sin + h * cos),
  }
}

function drawRotated(
  ctx: Rotatable,
  bitmap: ImageBitmap,
  rad: number,
  w: number,
  h: number
) {
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(w / 2, h / 2)
  ctx.rotate(rad)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
}

export async function rotateImageToBlob(
  file: File,
  angle: number
): Promise<Blob> {
  const norm = normalizeAngle(angle)
  if (norm === 0) return file

  const bitmap = await createImageBitmap(file)
  const rad = (norm * Math.PI) / 180
  const { w, h } = getRotatedSize(bitmap.width, bitmap.height, rad)

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable')
    drawRotated(ctx, bitmap, rad, w, h)
    bitmap.close()
    return await canvas.convertToBlob({ type: 'image/png' })
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d context unavailable')
  drawRotated(ctx, bitmap, rad, w, h)
  bitmap.close()
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png'
    )
  })
}
