export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

// Scale a rotated square so its axis-aligned bounding box fits the original square.
export function getRotatedFitScale(deg: number): number {
  const rad = (deg * Math.PI) / 180
  return 1 / (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)))
}
