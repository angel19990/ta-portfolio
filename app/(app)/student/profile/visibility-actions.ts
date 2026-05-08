"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type VisibilityResult = { ok: true } | { error: string }

export async function setVisibility(
  visibility: "public" | "private",
): Promise<VisibilityResult> {
  if (visibility !== "public" && visibility !== "private") {
    return { error: "Invalid visibility" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  // RLS gates this to the owner. The protect_actor_profile_approval trigger
  // ensures students can't tamper with approved_at by piggybacking on this update.
  const { error } = await supabase
    .from("actor_profiles")
    .update({ visibility })
    .eq("profile_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/student/profile")
  return { ok: true }
}
