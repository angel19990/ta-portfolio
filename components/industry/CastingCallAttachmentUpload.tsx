"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { uploadCastingCallAttachment } from "@/app/(app)/industry/casting-calls/attachment-actions"

type Props = {
  // Storage path (not a public URL — the bucket is private).
  value: string
  onChange: (path: string) => void
}

const MAX_BYTES = 10 * 1024 * 1024

export function CastingCallAttachmentUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, startUpload] = useTransition()

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) {
      setFile(null)
      return
    }
    if (f.type !== "application/pdf") {
      toast.error("File must be a PDF")
      e.target.value = ""
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error("File must be 10 MB or smaller")
      e.target.value = ""
      return
    }
    setFile(f)
  }

  function onUpload() {
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    startUpload(async () => {
      const result = await uploadCastingCallAttachment(fd)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(value ? "Attachment replaced" : "Attachment uploaded")
      onChange(result.url)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
    })
  }

  function onRemove() {
    onChange("")
    setFile(null)
    if (inputRef.current) inputRef.current.value = ""
    toast.info("Attachment cleared. Save to apply.")
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Attachment (PDF, optional)</p>
        <p className="text-xs text-muted-foreground">
          Sides, breakdown, or casting notice. 10 MB max. Visible to applicants.
        </p>
      </div>

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2 text-sm">
          <span className="truncate text-muted-foreground">
            On file: <span className="text-foreground">{value.split("/").pop()}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onPick}
          className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
        />
        <Button
          type="button"
          size="sm"
          onClick={onUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  )
}
