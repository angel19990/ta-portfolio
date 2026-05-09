"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"

export type ApplyResult = { ok: true; id: string } | { error: string }
export type WithdrawResult = { ok: true } | { error: string }

export async function applyToCastingCall(
  callId: string,
): Promise<ApplyResult> {
  if (!callId) return { error: "Missing call id" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "student") return { error: "Forbidden" }

  const supabase = await createClient()

  // Resolve the actor_profile owned by the current user. RLS on
  // casting_applications also enforces this, but the lookup gives us
  // a friendlier error than a 42501 RLS denial.
  const { data: profile, error: profileError } = await supabase
    .from("actor_profiles")
    .select("id")
    .eq("profile_id", me.id)
    .maybeSingle()
  if (profileError) return { error: profileError.message }
  if (!profile) {
    return {
      error: "Complete your profile before applying.",
    }
  }

  const { data, error } = await supabase
    .from("casting_applications")
    .insert({
      casting_call_id: callId,
      actor_profile_id: profile.id,
      status: "submitted",
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already applied to this call." }
    }
    return { error: error.message }
  }
  if (!data) return { error: "Insert returned no row" }

  revalidatePath("/student/casting-calls")
  revalidatePath(`/student/casting-calls/${callId}`)
  revalidatePath("/student/applications")
  return { ok: true, id: data.id }
}

export async function withdrawApplication(
  applicationId: string,
): Promise<WithdrawResult> {
  if (!applicationId) return { error: "Missing application id" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "student") return { error: "Forbidden" }

  const supabase = await createClient()
  // RLS `casting_applications_update_actor` enforces ownership server-side.
  // No-op if the row doesn't exist or already isn't yours.
  const { error } = await supabase
    .from("casting_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)

  if (error) return { error: error.message }

  revalidatePath("/student/casting-calls")
  revalidatePath("/student/applications")
  return { ok: true }
}
