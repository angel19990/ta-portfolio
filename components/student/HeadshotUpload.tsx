"use client"

import Image from "next/image"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { uploadHeadshot } from "@/app/(app)/student/profile/upload-actions"
import { ImageCropper, normalizeImageFile } from "@/components/student/ImageCropper"

type Props = {
  currentUrl: string | null
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

export function HeadshotUpload({ currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Source file picked by the user (pre-crop).
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  // Cropper open state.
  const [cropperOpen, setCropperOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function resetPicker() {
    setPickedFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) {
      setPickedFile(null)
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
    const normalized = await normalizeImageFile(f)
    setPickedFile(normalized)
    setCropperOpen(true)
  }

  function onConfirm(file: File) {
    return new Promise<void>((resolve) => {
      const formData = new FormData()
      formData.append("file", file)
      startTransition(async () => {
        const result = await uploadHeadshot(formData)
        if ("error" in result) {
          toast.error(result.error)
          resolve()
          return
        }
        toast.success("Headshot uploaded")
        setCropperOpen(false)
        resetPicker()
        resolve()
      })
    })
  }

  return (
    <>
      <section className="border-t border-foreground/10 pt-6">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Headshot
        </h2>
        <div className="flex items-start gap-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
            {currentUrl ? (
              <Image
                src={currentUrl}
                alt="Headshot"
                fill
                sizes="96px"
                className="object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No headshot
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP. 5 MB max. Pick a file to open the cropper.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPick}
              className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
            />
          </div>
        </div>
      </section>

      <ImageCropper
        open={cropperOpen}
        onOpenChange={(open) => {
          setCropperOpen(open)
          if (!open) resetPicker()
        }}
        imageFile={pickedFile}
        aspect={4 / 5}
        maxBytes={MAX_BYTES}
        outputName="headshot.jpg"
        confirmLabel="Upload headshot"
        pendingLabel="Uploading…"
        isPending={isPending}
        onConfirm={onConfirm}
      />
    </>
  )
}
