import { useCallback, useRef, useState } from 'react'
import { FileJson, FolderOpen, ImagePlus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { extractFilesFromDataTransfer } from '@/lib/load-files'
import { splitPngAndJson } from '@/lib/sticker-metadata'

type Props = {
  variant?: 'hero' | 'compact'
}

const WEBKIT_DIRECTORY_PROPS = {
  webkitdirectory: '',
  directory: '',
} as Record<string, string>

export function Dropzone({ variant = 'hero' }: Props) {
  const addImages = useStore((s) => s.addImages)
  const ingestMetadataFiles = useStore((s) => s.ingestMetadataFiles)
  const probeNewImages = useStore((s) => s.probeNewImages)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [isOver, setIsOver] = useState(false)

  const ingest = useCallback(
    async (files: File[]) => {
      const { png, json, skipped } = splitPngAndJson(files)
      if (png.length === 0 && json.length === 0 && skipped.length === 0) return

      if (json.length > 0) {
        const r = await ingestMetadataFiles(json)
        if (r.filesParsed > 0) {
          const parts: string[] = []
          if (r.stickersAdded > 0)
            parts.push(`+${r.stickersAdded} записей`)
          if (r.stickersReplaced > 0)
            parts.push(`перезаписано ${r.stickersReplaced}`)
          toast.success(
            `sizes.json загружен (${r.filesParsed} ${pluralFiles(r.filesParsed)})`,
            { description: parts.join(' · ') || undefined }
          )
        }
      }

      if (png.length > 0) {
        const { added, newIds } = addImages(png)
        if (added > 0) toast.success(`Добавлено изображений: ${added}`)
        else if (png.length > 0)
          toast.info('Все эти изображения уже добавлены')
        if (newIds.length > 0) {
          void probeNewImages(newIds)
        }
      }

      if (skipped.length > 0) {
        toast.warning(`Пропущено: ${skipped.length}`, {
          description:
            skipped.slice(0, 4).join(', ') + (skipped.length > 4 ? '…' : ''),
        })
      }
    },
    [addImages, ingestMetadataFiles, probeNewImages]
  )

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsOver(false)
      const files = await extractFilesFromDataTransfer(e.dataTransfer.items)
      await ingest(files)
    },
    [ingest]
  )

  const onFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files
      if (!list) return
      void ingest(Array.from(list))
      e.target.value = ''
    },
    [ingest]
  )

  const hiddenInputs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        multiple
        hidden
        onChange={onFiles}
      />
      <input
        ref={folderInputRef}
        type="file"
        hidden
        onChange={onFiles}
        {...WEBKIT_DIRECTORY_PROPS}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={onFiles}
      />
    </>
  )

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Добавить файлы
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="size-4" />
          Добавить папку
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => jsonInputRef.current?.click()}
        >
          <FileJson className="size-4" />
          sizes.json
        </Button>
        {hiddenInputs}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={cn(
        'relative flex w-full min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card/40 p-12 text-center transition-colors',
        isOver && 'border-primary bg-primary/5'
      )}
    >
      <div className="rounded-full bg-primary/10 p-4 text-primary">
        <Upload className="size-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">
          Перетащите PNG, папку или sizes.json сюда
        </h2>
        <p className="text-sm text-muted-foreground">
          Размеры стикеров подхватываются автоматически из sizes.json
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="size-4" />
          Выбрать файлы
        </Button>
        <Button
          variant="outline"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="size-4" />
          Выбрать папку
        </Button>
        <Button
          variant="outline"
          onClick={() => jsonInputRef.current?.click()}
        >
          <FileJson className="size-4" />
          Загрузить sizes.json
        </Button>
      </div>
      {hiddenInputs}
    </div>
  )
}

function pluralFiles(n: number): string {
  const r10 = n % 10
  const r100 = n % 100
  if (r100 >= 11 && r100 <= 14) return 'файлов'
  if (r10 === 1) return 'файл'
  if (r10 >= 2 && r10 <= 4) return 'файла'
  return 'файлов'
}
