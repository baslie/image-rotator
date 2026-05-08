type FsEntry = {
  isFile: boolean
  isDirectory: boolean
  name: string
  fullPath: string
  file?: (cb: (f: File) => void, err?: (e: unknown) => void) => void
  createReader?: () => {
    readEntries: (
      cb: (entries: FsEntry[]) => void,
      err?: (e: unknown) => void
    ) => void
  }
}

function readDirEntries(reader: NonNullable<FsEntry['createReader']> extends () => infer R ? R : never): Promise<FsEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FsEntry[] = []
    const next = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(all)
        else {
          all.push(...batch)
          next()
        }
      }, reject)
    }
    next()
  })
}

async function walkEntry(entry: FsEntry): Promise<File[]> {
  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) => {
      entry.file!((f) => resolve(f), reject)
    })
    return [file]
  }
  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader()
    const children = await readDirEntries(reader)
    const nested = await Promise.all(children.map(walkEntry))
    return nested.flat()
  }
  return []
}

export async function extractFilesFromDataTransfer(
  items: DataTransferItemList
): Promise<File[]> {
  const list: File[] = []
  const entries: FsEntry[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind !== 'file') continue
    const entry =
      'webkitGetAsEntry' in item
        ? (item as DataTransferItem & {
            webkitGetAsEntry: () => FsEntry | null
          }).webkitGetAsEntry()
        : null
    if (entry) {
      entries.push(entry)
    } else {
      const file = item.getAsFile()
      if (file) list.push(file)
    }
  }

  for (const entry of entries) {
    list.push(...(await walkEntry(entry)))
  }
  return list
}

export function filterPng(files: File[]): {
  png: File[]
  skipped: string[]
} {
  const png: File[] = []
  const skipped: string[] = []
  for (const f of files) {
    const isPng =
      f.type === 'image/png' || f.name.toLowerCase().endsWith('.png')
    if (isPng) png.push(f)
    else skipped.push(f.name)
  }
  return { png, skipped }
}
