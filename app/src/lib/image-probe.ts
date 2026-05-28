export async function probeImagePixelSize(
  file: File
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const width = bitmap.width
  const height = bitmap.height
  bitmap.close()
  return { width, height }
}
