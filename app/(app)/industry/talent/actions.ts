"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth/get-user"
import { friendlyError } from "@/lib/util/friendly-error"

export type ResumeUrlResult = { url: string } | { error: string }

const SIGNED_URL_TTL_SECONDS = 60

// Generate a signed URL to view an approved+public actor's resume.
// The resumes bucket is owner-only at the storage RLS level, so this action
// uses the service-role client. We gate access ourselves: caller must be an
// industry user (or admin), and the target actor must be visibility='public'
// AND approved_at IS NOT NULL.
export async function getActorResumeSignedUrl(
  actorProfileId: string,
): Promise<ResumeUrlResult> {
  if (!actorProfileId) return { error: "Missing actor id" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  // Use the user's own client first to confirm RLS visibility — this enforces
  // the same approved+public gate without us re-implementing it.
  const supabase = await createClient()
  const { data: actor, error } = await supabase
    .from("actor_profiles")
    .select("resume_url")
    .eq("id", actorProfileId)
    .maybeSingle()
  if (error) return { error: friendlyError(error) }
  if (!actor) return { error: "Actor not found" }
  if (!actor.resume_url) return { error: "No resume on file" }

  // Sign the URL with the admin client (storage RLS allows owner-only).
  const admin = createAdminClient()
  const { data, error: signErr } = await admin.storage
    .from("resumes")
    .createSignedUrl(actor.resume_url, SIGNED_URL_TTL_SECONDS)
  if (signErr || !data) return { error: friendlyError(signErr ?? { message: "Could not sign URL" }) }

  return { url: data.signedUrl }
}
