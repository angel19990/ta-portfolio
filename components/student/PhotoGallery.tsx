"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  addPhoto,
  deletePhoto,
} from "@/app/(app)/student/profile/photo-actions"

type Photo = { id: string; url: string }

type Props = {
  photos: Photo[]
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]
const PHOTO_LIMIT = 6

export function PhotoGallery({ photos }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, startUpload] = useTransition()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const atCap = photos.length >= PHOTO_LIMIT

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
    startUpload(async () => {
      const result = await addPhoto(formData)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Photo added")
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      router.refresh()
    })
  }

  function onDelete(id: string) {
    setPendingDeleteId(id)
    // No useTransition wrap so each row's pending state is independent.
    deletePhoto(id).then((result) => {
      setPendingDeleteId(null)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Photo removed")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Photo gallery</p>
          <p className="text-xs text-muted-foreground">
            Up to {PHOTO_LIMIT} photos. JPEG, PNG, or WebP. 5 MB each.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {photos.length} / {PHOTO_LIMIT}
        </p>
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {photos.map((p) => (
            <li
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt="Gallery photo"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                disabled={pendingDeleteId === p.id}
                className="absolute inset-x-1 bottom-1 rounded-sm bg-black/70 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
              >
                {pendingDeleteId === p.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          disabled={atCap}
          className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="button"
          size="sm"
          onClick={onUpload}
          disabled={!file || isUploading || atCap}
        >
          {isUploading ? "Uploading…" : "Add photo"}
        </Button>
      </div>
      {atCap ? (
        <p className="text-xs text-muted-foreground">
          You&apos;ve reached the {PHOTO_LIMIT}-photo limit. Remove one to add another.
        </p>
      ) : null}
    </div>
  )
}
