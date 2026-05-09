"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { verifyMagicBytes } from "@/lib/util/file-magic"
import { friendlyError } from "@/lib/util/friendly-error"

export type ResumeUploadResult = { ok: true } | { error: string }
export type ResumeUrlResult = { url: string } | { error: string }

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB — resumes can be larger
const SIGNED_URL_TTL_SECONDS = 60

export async function uploadResume(
  formData: FormData,
): Promise<ResumeUploadResult> {
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
  if (!(await verifyMagicBytes(file, "pdf"))) {
    return { error: "File contents don't match its declared type" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  // Read previous resume path so we can clean it up after a successful replace.
  // resume_url stores the storage path directly (not a URL), so no URL parsing.
  const { data: existing } = await supabase
    .from("actor_profiles")
    .select("resume_url")
    .eq("profile_id", user.id)
    .maybeSingle()
  const previousPath = existing?.resume_url ?? null

  const path = `${user.id}/resume-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file, { contentType: "application/pdf", upsert: false })
  if (uploadError) return { error: friendlyError(uploadError) }

  // Store the storage path (not a URL) — resumes bucket is private; we sign on read.
  const { error: dbError } = await supabase
    .from("actor_profiles")
    .upsert(
      { profile_id: user.id, resume_url: path },
      { onConflict: "profile_id" },
    )
  if (dbError) {
    await supabase.storage.from("resumes").remove([path])
    return { error: friendlyError(dbError) }
  }

  if (previousPath && previousPath !== path) {
    await supabase.storage.from("resumes").remove([previousPath])
  }

  revalidatePath("/student/profile")
  return { ok: true }
}

export async function getResumeSignedUrl(): Promise<ResumeUrlResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  const { data: actor, error: fetchErr } = await supabase
    .from("actor_profiles")
    .select("resume_url")
    .eq("profile_id", user.id)
    .maybeSingle()
  if (fetchErr) return { error: friendlyError(fetchErr) }
  if (!actor?.resume_url) return { error: "No resume on file" }

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(actor.resume_url, SIGNED_URL_TTL_SECONDS)
  if (error || !data) return { error: friendlyError(error ?? { message: "Could not sign URL" }) }

  return { url: data.signedUrl }
}
