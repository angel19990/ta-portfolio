"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { friendlyError } from "@/lib/util/friendly-error"

export type ResumeUrlResult = { url: string } | { error: string }

export type ActorPhoto = { id: string; url: string }

export type ActorDetail = {
  ethnicity: string | null
  current_job: string | null
  favorite_movies: string | null
  favorite_series: string | null
  resume_url: string | null
  photos: ActorPhoto[]
}

export type ActorDetailResult = { detail: ActorDetail } | { error: string }

const SIGNED_URL_TTL_SECONDS = 60

// Lazy-load the bits the public side panel needs that aren't in the
// listing query (ethnicity, resume flag, gallery). RLS gates visibility
// the same way it does for the detail page route.
export async function loadActorDetail(
  actorProfileId: string,
): Promise<ActorDetailResult> {
  if (!actorProfileId) return { error: "Missing actor id" }

  const supabase = await createClient()
  const [actorRes, photosRes] = await Promise.all([
    supabase
      .from("actor_profiles")
      .select(
        "ethnicity, current_job, favorite_movies, favorite_series, resume_url",
      )
      .eq("id", actorProfileId)
      .maybeSingle(),
    supabase
      .from("actor_photos")
      .select("id, url")
      .eq("actor_profile_id", actorProfileId)
      .order("created_at", { ascending: true }),
  ])

  if (actorRes.error) return { error: friendlyError(actorRes.error) }
  if (!actorRes.data) return { error: "Actor not found" }
  if (photosRes.error) return { error: friendlyError(photosRes.error) }

  return {
    detail: {
      ethnicity: actorRes.data.ethnicity,
      current_job: actorRes.data.current_job,
      favorite_movies: actorRes.data.favorite_movies,
      favorite_series: actorRes.data.favorite_series,
      resume_url: actorRes.data.resume_url,
      photos: photosRes.data ?? [],
    },
  }
}

// Generate a signed URL to view an actor's resume PDF.
//
// The `resumes` bucket is private (owner-only storage RLS), so signing
// requires the service-role client. Access is gated by visibility, not
// by role: anyone can call this for an approved+public actor. The user
// client's RLS does the gating — if the SELECT returns no row, the
// caller isn't permitted to see this actor and we refuse.
export async function getActorResumeSignedUrl(
  actorProfileId: string,
): Promise<ResumeUrlResult> {
  if (!actorProfileId) return { error: "Missing actor id" }

  const supabase = await createClient()
  const { data: actor, error } = await supabase
    .from("actor_profiles")
    .select("resume_url")
    .eq("id", actorProfileId)
    .maybeSingle()
  if (error) return { error: friendlyError(error) }
  if (!actor) return { error: "Actor not found" }
  if (!actor.resume_url) return { error: "No resume on file" }

  const admin = createAdminClient()
  const { data, error: signErr } = await admin.storage
    .from("resumes")
    .createSignedUrl(actor.resume_url, SIGNED_URL_TTL_SECONDS)
  if (signErr || !data) return { error: friendlyError(signErr ?? { message: "Could not sign URL" }) }

  return { url: data.signedUrl }
}
