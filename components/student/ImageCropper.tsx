"use client"

import { useCallback, useEffect, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Input image to crop. Should already be EXIF-normalized — the parent
  // can use `normalizeImageFile` exported from this file before opening
  // the cropper to avoid orientation drift.
  imageFile: File | null
  // Aspect ratio. undefined falls back to react-easy-crop's 4:3 default —
  // pass an explicit number for portrait/square crops.
  aspect?: number
  // Max output bytes — re-checks the cropped Blob.
  maxBytes: number
  // Suggested filename for the output File.
  outputName?: string
  // Button label for the confirm action — defaults to "Done", but callers
  // typically pass "Upload …" / "Add photo" so the cropper acts as the
  // single submit step.
  confirmLabel?: string
  // Label while the parent's onConfirm is running (e.g. "Uploading…").
  pendingLabel?: string
  // True while the parent is processing the cropped file (uploading, etc).
  // Disables the confirm button and keeps the dialog open so errors surface.
  isPending?: boolean
  // Called with the cropped JPEG File once the user confirms. The parent
  // is responsible for closing the dialog (via onOpenChange(false)) after
  // its async work completes successfully.
  onConfirm: (file: File) => void | Promise<void>
}

export function ImageCropper({
  open,
  onOpenChange,
  imageFile,
  aspect,
  maxBytes,
  outputName = "crop.jpg",
  confirmLabel = "Done",
  pendingLabel = "Saving…",
  isPending = false,
  onConfirm,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  // Convert the File to an object URL so the Cropper can render it.
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null)
      setCroppedAreaPixels(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImageSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const onCropAreaChange = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function onConfirmClick() {
    if (!imageFile) return
    setProcessing(true)
    try {
      const blob = await getCroppedBlob(
        imageFile,
        croppedAreaPixels,
        aspect,
      )
      if (!blob) {
        toast.error("Could not crop image")
        return
      }
      if (blob.size > maxBytes) {
        toast.error(
          `Cropped image is ${(blob.size / 1024 / 1024).toFixed(1)} MB. Max is ${
            maxBytes / 1024 / 1024
          } MB. Try a tighter crop.`,
        )
        return
      }
      const file = new File([blob], outputName, { type: "image/jpeg" })
      await onConfirm(file)
    } finally {
      setProcessing(false)
    }
  }

  const busy = processing || isPending

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust image</DialogTitle>
          <DialogDescription>
            Drag to reposition. Use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaChange}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
            aria-label="Zoom"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirmClick} disabled={busy}>
            {isPending ? pendingLabel : processing ? "Processing…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Bake EXIF orientation into the pixel data of a fresh JPEG. Call this
// BEFORE handing a File to the cropper. iPhone photos shot in portrait are
// often stored as landscape with a rotation flag — react-easy-crop reads
// the image dimensions through HTMLImageElement which may or may not honor
// the flag, and reports pixel-coords that don't match the displayed
// orientation. Normalizing up front sidesteps the whole problem.
export async function normalizeImageFile(file: File): Promise<File> {
  // createImageBitmap honors EXIF orientation when imageOrientation is
  // 'from-image' (default in modern browsers, but explicit here for safety).
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    // Fallback: return the file as-is. The cropper will still try its best.
    return file
  }
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
  })
  if (!blob) return file
  return new File([blob], file.name, { type: "image/jpeg" })
}

// Render the cropped region of the image to an offscreen canvas and return
// a JPEG blob. Always JPEG so the server's magic-byte check (which only
// accepts JPEG/PNG/WebP/PDF) has a predictable input.
//
// Defensive: if the croppedAreaPixels are null OR their aspect disagrees
// with what we asked for, fall back to a centered crop of the full image
// at the requested aspect. That way we never produce a 1:10 sliver even if
// react-easy-crop misbehaves.
async function getCroppedBlob(
  imageFile: File,
  pixels: Area | null,
  aspect?: number,
): Promise<Blob | null> {
  const bitmap = await createImageBitmap(imageFile, {
    imageOrientation: "from-image",
  })

  // Decide the source rectangle and output dimensions.
  let sx: number
  let sy: number
  let sw: number
  let sh: number

  const reportedOk =
    pixels != null &&
    pixels.width > 0 &&
    pixels.height > 0 &&
    (!aspect ||
      Math.abs(pixels.width / pixels.height - aspect) < 0.02)

  if (reportedOk && pixels) {
    sx = pixels.x
    sy = pixels.y
    sw = pixels.width
    sh = pixels.height
  } else if (aspect && Number.isFinite(aspect) && aspect > 0) {
    // Fallback: centered crop of the bitmap at the requested aspect.
    const bw = bitmap.width
    const bh = bitmap.height
    if (bw / bh > aspect) {
      // Bitmap is wider than the requested aspect — limit by height.
      sh = bh
      sw = bh * aspect
      sx = (bw - sw) / 2
      sy = 0
    } else {
      // Bitmap is taller than the requested aspect — limit by width.
      sw = bw
      sh = bw / aspect
      sx = 0
      sy = (bh - sh) / 2
    }
  } else if (pixels) {
    sx = pixels.x
    sy = pixels.y
    sw = pixels.width
    sh = pixels.height
  } else {
    sx = 0
    sy = 0
    sw = bitmap.width
    sh = bitmap.height
  }

  const canvas = document.createElement("canvas")
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return null
  }
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)
  bitmap.close()
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9)
  })
}
