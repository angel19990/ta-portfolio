import "server-only"

import { createClient } from "@/lib/supabase/server"

export type StudentStatus =
  | "inactive"
  | "pending_approval"
  | "approved"
  | "private"

export type AdminStudentActor = {
  id: string
  headshot_url: string | null
  visibility: "private" | "public"
  approved_at: string | null
  bio: string | null
  location: string | null
  skills: string[] | null
  age: number | null
}

export type AdminStudent = {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  actor_profile: AdminStudentActor | null
  status: StudentStatus
}

export async function listStudentsForAdmin(): Promise<AdminStudent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        email,
        full_name,
        is_active,
        created_at,
        actor_profiles (
          id,
          headshot_url,
          visibility,
          approved_at,
          bio,
          location,
          skills,
          age
        )
      `,
    )
    .eq("role", "student")
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((row) => {
    // 1:1 embed: PostgREST may return either an object or a single-element array
    // depending on how it detects the relationship. Normalize to one or none.
    const raw = (row as { actor_profiles: unknown }).actor_profiles
    const actor = (Array.isArray(raw) ? raw[0] : raw) as
      | AdminStudentActor
      | null
      | undefined
    const actorProfile = actor ?? null

    let status: StudentStatus
    if (!row.is_active) status = "inactive"
    else if (!actorProfile) status = "private"
    else if (
      actorProfile.visibility === "public" &&
      !actorProfile.approved_at
    )
      status = "pending_approval"
    else if (actorProfile.approved_at) status = "approved"
    else status = "private"

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      is_active: row.is_active,
      created_at: row.created_at,
      actor_profile: actorProfile,
      status,
    }
  })
}
