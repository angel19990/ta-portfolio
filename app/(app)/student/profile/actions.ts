"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { friendlyError } from "@/lib/util/friendly-error"
import {
  actorProfileSchema,
  type TalentProfileInput,
} from "@/lib/validators/actor-profile"

export type SaveResult = { ok: true } | { error: string }

const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim())

export async function saveTalentProfile(
  input: TalentProfileInput,
): Promise<SaveResult> {
  const parsed = actorProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in" }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: v.full_name })
    .eq("id", user.id)
  if (profileError) return { error: friendlyError(profileError) }

  const { error: actorError } = await supabase.from("actor_profiles").upsert(
    {
      profile_id: user.id,
      age: v.age,
      location: emptyToNull(v.location),
      birthplace: emptyToNull(v.birthplace),
      bio: emptyToNull(v.bio),
      skills: v.skills,
      reel_url: emptyToNull(v.reel_url),
    },
    { onConflict: "profile_id" },
  )
  if (actorError) return { error: friendlyError(actorError) }

  revalidatePath("/student/profile")
  return { ok: true }
}
