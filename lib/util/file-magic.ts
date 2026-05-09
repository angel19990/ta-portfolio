// Magic-byte verification for uploads. file.type is client-supplied and can
// be spoofed; this checks the first 12 bytes of the actual file body match
// the declared format. Storage buckets are public-read for headshots/photos
// so this also blocks an attacker from uploading e.g. an SVG with a PNG
// MIME type (which would be served back with the stored content-type).

export type ExpectedFormat = "jpeg" | "png" | "webp" | "pdf"

export async function verifyMagicBytes(
  file: File,
  expected: ExpectedFormat,
): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  switch (expected) {
    case "jpeg":
      // FF D8 FF
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
    case "png":
      // 89 50 4E 47 0D 0A 1A 0A
      return (
        head[0] === 0x89 &&
        head[1] === 0x50 &&
        head[2] === 0x4e &&
        head[3] === 0x47
      )
    case "webp":
      // RIFF....WEBP
      return (
        head[0] === 0x52 &&
        head[1] === 0x49 &&
        head[2] === 0x46 &&
        head[3] === 0x46 &&
        head[8] === 0x57 &&
        head[9] === 0x45 &&
        head[10] === 0x42 &&
        head[11] === 0x50
      )
    case "pdf":
      // %PDF
      return (
        head[0] === 0x25 &&
        head[1] === 0x50 &&
        head[2] === 0x44 &&
        head[3] === 0x46
      )
  }
}

const MIME_TO_FORMAT: Record<string, ExpectedFormat> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

export function expectedFormatForMime(
  mime: string,
): ExpectedFormat | undefined {
  return MIME_TO_FORMAT[mime]
}
