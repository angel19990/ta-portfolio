"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type PhotoActionResult =
  | { ok: true; url?: string }
  | { error: string }

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

const PHOTO_LIMIT = 6

export async function addPhoto(
  formData: FormData,
): Promise<PhotoActionResult> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected" }
  }
  if (file.size > MAX_BYTES) {
    return { error: "File must be 5 MB or smaller" }
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "File must be JPEG, PNG, or WebP" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  // Need actor_profiles.id (PK) for the foreign key, not the profile_id.
  const { data: actor, error: actorErr } = await supabase
    .from("actor_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()
  if (actorErr) return { error: actorErr.message }
  if (!actor) {
    return { error: "Save your profile details first, then add photos." }
  }

  const ext = MIME_TO_EXT[file.type]
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { data: pub } = supabase.storage.from("photos").getPublicUrl(path)
  const url = pub.publicUrl

  const { error: insertError } = await supabase
    .from("actor_photos")
    .insert({ actor_profile_id: actor.id, url })

  if (insertError) {
    // Clean up the orphaned storage object if the DB write failed (cap reached, etc.)
    await supabase.storage.from("photos").remove([path])
    if (insertError.message.includes("limit (6)")) {
      return { error: `You can have at most ${PHOTO_LIMIT} photos. Delete one first.` }
    }
    return { error: insertError.message }
  }

  revalidatePath("/student/profile")
  return { ok: true, url }
}

export async function deletePhoto(photoId: string): Promise<PhotoActionResult> {
  if (!photoId) return { error: "Missing photo id" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  // Get the URL so we can derive the storage path.
  const { data: row, error: fetchErr } = await supabase
    .from("actor_photos")
    .select("url")
    .eq("id", photoId)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!row) return { error: "Photo not found" }

  // URL → path: everything after "/photos/" is the object path.
  const marker = "/photos/"
  const idx = row.url.indexOf(marker)
  const path = idx >= 0 ? row.url.slice(idx + marker.length) : null

  // Delete the DB row first — RLS enforces ownership.
  const { error: dbErr } = await supabase
    .from("actor_photos")
    .delete()
    .eq("id", photoId)
  if (dbErr) return { error: dbErr.message }

  // Best-effort storage cleanup.
  if (path) {
    await supabase.storage.from("photos").remove([path])
  }

  revalidatePath("/student/profile")
  return { ok: true }
}
