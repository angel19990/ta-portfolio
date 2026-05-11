"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  uploadResume,
  getResumeSignedUrl,
} from "@/app/(app)/student/profile/resume-actions"

type Props = {
  hasResume: boolean
}

const MAX_BYTES = 10 * 1024 * 1024

export function ResumeUpload({ hasResume }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isUploading, startUpload] = useTransition()
  const [isViewing, startView] = useTransition()

  // Object URL for the picked PDF so the <iframe> preview can render it.
  // Revoked on close / replace to release memory.
  useEffect(() => {
    if (!pickedFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(pickedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pickedFile])

  function resetPicker() {
    setPickedFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) {
      setPickedFile(null)
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
    setPickedFile(f)
    setPreviewOpen(true)
  }

  function onUpload() {
    if (!pickedFile) return
    const formData = new FormData()
    formData.append("file", pickedFile)
    startUpload(async () => {
      const result = await uploadResume(formData)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(hasResume ? "Resume replaced" : "Resume uploaded")
      setPreviewOpen(false)
      resetPicker()
    })
  }

  function onView() {
    startView(async () => {
      const result = await getResumeSignedUrl()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      window.open(result.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <>
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Resume</p>
            <p className="text-xs text-muted-foreground">
              PDF only. 10 MB max. {hasResume ? "Currently on file." : "No file uploaded."}
              {" "}Pick a file to preview before uploading.
            </p>
          </div>
          {hasResume ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onView}
              disabled={isViewing}
            >
              {isViewing ? "Opening…" : "View resume"}
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onPick}
          className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
        />
      </div>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (isUploading) return
          setPreviewOpen(open)
          if (!open) resetPicker()
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {hasResume ? "Replace resume" : "Upload resume"}
            </DialogTitle>
            <DialogDescription>
              Preview the PDF below before uploading.
              {pickedFile ? ` ${pickedFile.name} · ${formatBytes(pickedFile.size)}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-[480px] w-full overflow-hidden rounded-md border bg-muted">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="Resume preview"
                className="absolute inset-0 h-full w-full"
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onUpload} disabled={isUploading}>
              {isUploading
                ? "Uploading…"
                : hasResume
                  ? "Replace resume"
                  : "Upload resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
