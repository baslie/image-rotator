export async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  const out: U[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = cursor++
        if (i >= items.length) return
        out[i] = await fn(items[i], i)
      }
    }
  )
  await Promise.all(workers)
  return out
}
