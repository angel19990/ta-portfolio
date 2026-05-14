"use client"

import Image from "next/image"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  addPhoto,
  deletePhoto,
} from "@/app/(app)/student/profile/photo-actions"
import { transformedImage } from "@/lib/util/storage-image"
import { ImageCropper, normalizeImageFile } from "@/components/student/ImageCropper"

type Photo = { id: string; url: string }

type Props = {
  photos: Photo[]
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]
const PHOTO_LIMIT = 6

export function PhotoGallery({ photos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [isUploading, startUpload] = useTransition()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const atCap = photos.length >= PHOTO_LIMIT

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
    // Bake EXIF orientation into pixel data so the cropper sees the image
    // the same way the user does.
    const normalized = await normalizeImageFile(f)
    setPickedFile(normalized)
    setCropperOpen(true)
  }

  function onConfirm(file: File) {
    return new Promise<void>((resolve) => {
      const formData = new FormData()
      formData.append("file", file)
      startUpload(async () => {
        const result = await addPhoto(formData)
        if ("error" in result) {
          toast.error(result.error)
          resolve()
          return
        }
        toast.success("Photo added")
        setCropperOpen(false)
        resetPicker()
        resolve()
      })
    })
  }

  function onDelete(id: string) {
    setPendingDeleteId(id)
    deletePhoto(id).then((result) => {
      setPendingDeleteId(null)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Photo removed")
    })
  }

  return (
    <>
      <section className="space-y-3 border-t border-foreground/10 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Photo gallery
          </h2>
          <p className="text-xs text-muted-foreground">
            {photos.length} / {PHOTO_LIMIT}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Up to {PHOTO_LIMIT} photos. JPEG, PNG, or WebP. 5 MB each. Pick a file to open the cropper.
        </p>

        {photos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map((p, i) => (
              <li
                key={p.id}
                className="group relative aspect-[2/3] overflow-hidden rounded-md bg-muted"
              >
                <Image
                  src={transformedImage(p.url, { width: 400 })!}
                  alt={`Photo ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 33vw, 16vw"
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute inset-x-1 bottom-1 rounded-sm bg-black/70 px-2 py-1 text-xs font-medium text-white opacity-0 outline-none transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 [@media(hover:none)]:opacity-100"
                >
                  {pendingDeleteId === p.id ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={atCap}
          className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {atCap ? (
          <p className="text-xs text-muted-foreground">
            You&apos;ve reached the {PHOTO_LIMIT}-photo limit. Remove one to add another.
          </p>
        ) : null}
      </section>

      <ImageCropper
        open={cropperOpen}
        onOpenChange={(open) => {
          setCropperOpen(open)
          if (!open) resetPicker()
        }}
        imageFile={pickedFile}
        aspect={2 / 3}
        maxBytes={MAX_BYTES}
        outputName="photo.jpg"
        confirmLabel="Add photo"
        pendingLabel="Uploading…"
        isPending={isUploading}
        onConfirm={onConfirm}
      />
    </>
  )
}
