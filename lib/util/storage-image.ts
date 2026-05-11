// Build a Supabase storage image-transform URL. The transform endpoint is
// /storage/v1/render/image/public/<bucket>/<path>?width=&quality=
// — distinct from the raw /object/public/ URL the upload helpers store.
//
// We pass the original URL through (which is already a public storage URL)
// and rewrite the path prefix. For non-Supabase URLs (or empty), we return
// the input unchanged.
const RAW_PREFIX = "/storage/v1/object/public/"
const RENDER_PREFIX = "/storage/v1/render/image/public/"

export function transformedImage(
  url: string | null | undefined,
  opts: { width: number; quality?: number },
): string | null {
  if (!url) return null
  const idx = url.indexOf(RAW_PREFIX)
  if (idx < 0) return url
  const transformed =
    url.slice(0, idx) + RENDER_PREFIX + url.slice(idx + RAW_PREFIX.length)
  const sep = transformed.includes("?") ? "&" : "?"
  const quality = opts.quality ?? 80
  return `${transformed}${sep}width=${opts.width}&resize=contain&quality=${quality}`
}

// Extract the storage object path (e.g. "<uid>/headshot-<ts>.jpg") from a
// public storage URL like
//   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>?…
// Used by the upload actions to clean up an old object after replacing it,
// or by deletePhoto to derive the storage path from the stored URL.
export function pathFromPublicUrl(
  bucket: string,
  url: string | null | undefined,
): string | null {
  if (!url) return null
  const marker = `${RAW_PREFIX}${bucket}/`
  const idx = url.indexOf(marker)
  if (idx < 0) return null
  const tail = url.slice(idx + marker.length)
  // Drop any query string (image transform URLs may include ?width=…).
  const q = tail.indexOf("?")
  return q >= 0 ? tail.slice(0, q) : tail
}
