"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import {
  expectedFormatForMime,
  verifyMagicBytes,
} from "@/lib/util/file-magic"
import { friendlyError } from "@/lib/util/friendly-error"

export type AttachmentUploadResult =
  | { ok: true; url: string }
  | { error: string }
export type AttachmentSignedUrlResult =
  | { ok: true; url: string }
  | { error: string }
export type AttachmentRemoveResult = { ok: true } | { error: string }

const BUCKET = "casting-call-attachments"
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// Upload accepts the raw File and writes it under the caller's uid folder.
// `attachment_url` stored on casting_calls is the storage path (not a public
// URL), since the bucket is private and we mint signed URLs on demand.
export async function uploadCastingCallAttachment(
  formData: FormData,
): Promise<AttachmentUploadResult> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected" }
  }
  if (file.size > MAX_BYTES) {
    return { error: "File must be 10 MB or smaller" }
  }
  if (file.type !== "application/pdf") {
    return { error: "File must be a PDF" }
  }
  const format = expectedFormatForMime(file.type)
  if (!format || !(await verifyMagicBytes(file, format))) {
    return { error: "File contents don't match its declared type" }
  }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  const supabase = await createClient()
  const rand = Math.random().toString(36).slice(2, 10)
  const path = `${me.id}/casting-call-${Date.now()}-${rand}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: friendlyError(uploadError) }

  return { ok: true, url: path }
}

// Mint a short-lived signed URL. RLS on casting_calls already enforces who
// can read the row — we re-select to confirm the caller has access.
export async function getCastingCallAttachmentSignedUrl(
  callId: string,
): Promise<AttachmentSignedUrlResult> {
  if (!callId) return { error: "Missing id" }

  const supabase = await createClient()
  const { data: call, error: callError } = await supabase
    .from("casting_calls")
    .select("attachment_url")
    .eq("id", callId)
    .maybeSingle()
  if (callError) return { error: friendlyError(callError) }
  if (!call) return { error: "Call not found" }
  if (!call.attachment_url) return { error: "No attachment" }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(call.attachment_url, 600)
  if (error) return { error: friendlyError(error) }
  if (!data?.signedUrl) return { error: "Could not generate URL" }

  return { ok: true, url: data.signedUrl }
}

// Removes the storage object and clears the column. Re-validates ownership
// via RLS on the update (only owner or admin can update the row).
export async function removeCastingCallAttachment(
  callId: string,
): Promise<AttachmentRemoveResult> {
  if (!callId) return { error: "Missing id" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  const supabase = await createClient()
  const { data: call, error: readError } = await supabase
    .from("casting_calls")
    .select("attachment_url")
    .eq("id", callId)
    .maybeSingle()
  if (readError) return { error: friendlyError(readError) }
  if (!call) return { error: "Call not found" }
  const path = call.attachment_url

  const { error: updateError } = await supabase
    .from("casting_calls")
    .update({ attachment_url: null })
    .eq("id", callId)
  if (updateError) return { error: friendlyError(updateError) }

  if (path) {
    // Best-effort: don't fail if the bucket object is already gone.
    await supabase.storage.from(BUCKET).remove([path])
  }

  revalidatePath("/industry/casting-calls")
  revalidatePath(`/industry/casting-calls/${callId}/edit`)
  revalidatePath("/student/casting-calls")
  return { ok: true }
}
