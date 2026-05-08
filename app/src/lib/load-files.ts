function readDirEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
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

async function walkEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject)
    })
    return [file]
  }
  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()
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
  const entries: FileSystemEntry[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind !== 'file') continue
    const entry = item.webkitGetAsEntry()
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
