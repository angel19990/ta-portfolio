"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, startUpload] = useTransition()
  const [isViewing, startView] = useTransition()

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
    const formData = new FormData()
    formData.append("file", file)
    startUpload(async () => {
      const result = await uploadResume(formData)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(hasResume ? "Resume replaced" : "Resume uploaded")
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
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
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Resume</p>
          <p className="text-xs text-muted-foreground">
            PDF only. 10 MB max. {hasResume ? "Currently on file." : "No file uploaded."}
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
          {isUploading ? "Uploading…" : hasResume ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  )
}
