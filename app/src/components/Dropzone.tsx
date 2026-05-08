import { useCallback, useRef, useState } from 'react'
import { FolderOpen, ImagePlus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import {
  extractFilesFromDataTransfer,
  filterPng,
} from '@/lib/load-files'

type Props = {
  variant?: 'hero' | 'compact'
}

const WEBKIT_DIRECTORY_PROPS = {
  webkitdirectory: '',
  directory: '',
} as Record<string, string>

export function Dropzone({ variant = 'hero' }: Props) {
  const addImages = useStore((s) => s.addImages)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [isOver, setIsOver] = useState(false)

  const ingest = useCallback(
    (files: File[]) => {
      const { png, skipped } = filterPng(files)
      if (png.length === 0 && skipped.length === 0) return
      const added = addImages(png)
      if (added > 0) toast.success(`Добавлено изображений: ${added}`)
      if (skipped.length > 0)
        toast.warning(
          `Пропущено не-PNG файлов: ${skipped.length}`,
          {
            description:
              skipped.slice(0, 4).join(', ') +
              (skipped.length > 4 ? '…' : ''),
          }
        )
      if (added === 0 && png.length > 0)
        toast.info('Все эти изображения уже добавлены')
    },
    [addImages]
  )

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsOver(false)
      const files = await extractFilesFromDataTransfer(e.dataTransfer.items)
      ingest(files)
    },
    [ingest]
  )

  const onFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files
      if (!list) return
      ingest(Array.from(list))
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
          Перетащите PNG-изображения или папку сюда
        </h2>
        <p className="text-sm text-muted-foreground">
          Поддерживаются файлы и целые папки. Прозрачность сохраняется.
        </p>
      </div>
      <div className="flex gap-2">
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
      </div>
      {hiddenInputs}
    </div>
  )
}
