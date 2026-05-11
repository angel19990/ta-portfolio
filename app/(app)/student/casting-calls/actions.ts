"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { friendlyError } from "@/lib/util/friendly-error"
import {
  getMyApplicationForCall,
  type ApplicationStatus,
} from "@/lib/db/casting-applications"

export type ApplyResult = { ok: true; id: string } | { error: string }
export type WithdrawResult = { ok: true } | { error: string }

export type StudentCallContext = {
  hasProfile: boolean
  application: { id: string; status: ApplicationStatus } | null
}

// Lazy-load the bits the student side panel needs that aren't in the
// listing query: whether the student has a profile (gates apply), and
// whether they've already applied to this specific call.
export async function loadStudentCallContext(
  callId: string,
): Promise<{ context: StudentCallContext } | { error: string }> {
  if (!callId) return { error: "Missing call id" }
  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "student") return { error: "Forbidden" }

  const supabase = await createClient()
  const [profileRes, application] = await Promise.all([
    supabase
      .from("actor_profiles")
      .select("id")
      .eq("profile_id", me.id)
      .maybeSingle(),
    getMyApplicationForCall(callId, me.id),
  ])
  if (profileRes.error) return { error: friendlyError(profileRes.error) }

  return {
    context: {
      hasProfile: profileRes.data !== null,
      application,
    },
  }
}

export async function applyToCastingCall(
  callId: string,
): Promise<ApplyResult> {
  if (!callId) return { error: "Missing call id" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "student") return { error: "Forbidden" }

  const supabase = await createClient()

  // Resolve actor_profile + verify call status in parallel. RLS on
  // casting_applications would block a closed-call insert via 42501, but
  // the user-facing message reads better when we map it to "this call has
  // closed" before attempting the insert.
  const [profileResult, callResult] = await Promise.all([
    supabase
      .from("actor_profiles")
      .select("id")
      .eq("profile_id", me.id)
      .maybeSingle(),
    supabase
      .from("casting_calls")
      .select("status")
      .eq("id", callId)
      .maybeSingle(),
  ])
  if (profileResult.error) return { error: friendlyError(profileResult.error) }
  if (!profileResult.data) {
    return { error: "Complete your profile before applying." }
  }
  if (callResult.error) return { error: friendlyError(callResult.error) }
  if (!callResult.data) return { error: "Casting call not found" }
  if (callResult.data.status !== "open") {
    return { error: "This call is no longer open." }
  }
  const profile = profileResult.data

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
    return { error: friendlyError(error) }
  }
  if (!data) return { error: "Insert returned no row" }

  revalidatePath("/student/casting-calls")
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
  // RLS `casting_applications_withdraw_actor` (migration 0008) restricts the
  // new status to 'withdrawn' for the owning actor.
  const { error } = await supabase
    .from("casting_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)

  if (error) return { error: friendlyError(error) }

  revalidatePath("/student/casting-calls")
  revalidatePath("/student/applications")
  return { ok: true }
}
