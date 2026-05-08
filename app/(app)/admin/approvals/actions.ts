"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export type ApproveResult = { ok: true } | { error: string }

export async function approveActor(
  actorProfileId: string,
): Promise<ApproveResult> {
  if (!actorProfileId) return { error: "Missing id" }

  // Belt-and-suspenders role check; RLS + the protect_actor_profile_approval
  // trigger also enforce admin-only writes to approved_at.
  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "admin") return { error: "Forbidden" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("actor_profiles")
    .update({ approved_at: new Date().toISOString() })
    .eq("id", actorProfileId)
  if (error) return { error: error.message }

  revalidatePath("/admin/approvals")
  return { ok: true }
}
