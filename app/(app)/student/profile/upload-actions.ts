"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type UploadResult = { ok: true; url: string } | { error: string }

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function uploadHeadshot(
  formData: FormData,
): Promise<UploadResult> {
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

  const ext = MIME_TO_EXT[file.type]
  const path = `${user.id}/headshot-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("headshots")
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { data: pub } = supabase.storage.from("headshots").getPublicUrl(path)
  const url = pub.publicUrl

  const { error: dbError } = await supabase
    .from("actor_profiles")
    .upsert(
      { profile_id: user.id, headshot_url: url },
      { onConflict: "profile_id" },
    )
  if (dbError) return { error: dbError.message }

  revalidatePath("/student/profile")
  return { ok: true, url }
}
