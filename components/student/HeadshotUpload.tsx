"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { uploadHeadshot } from "@/app/(app)/student/profile/upload-actions"

type Props = {
  currentUrl: string | null
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

export function HeadshotUpload({ currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) {
      setFile(null)
      return
    }
    if (!ALLOWED_MIME.includes(f.type)) {
      toast.error("File must be JPEG, PNG, or WebP")
      e.target.value = ""
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error("File must be 5 MB or smaller")
      e.target.value = ""
      return
    }
    setFile(f)
  }

  function onUpload() {
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    startTransition(async () => {
      const result = await uploadHeadshot(formData)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Headshot uploaded")
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
    })
  }

  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <div className="size-24 shrink-0 overflow-hidden rounded-md border bg-muted">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Headshot"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No headshot
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div>
          <p className="text-sm font-medium">Headshot</p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP. 5 MB max.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
          />
          <Button
            type="button"
            size="sm"
            onClick={onUpload}
            disabled={!file || isPending}
          >
            {isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  )
}
