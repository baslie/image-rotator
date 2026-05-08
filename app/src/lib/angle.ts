export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}
