import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { CastingCallRow } from "@/lib/db/casting-calls"

export type ApplicationStatus =
  | "submitted"
  | "shortlisted"
  | "rejected"
  | "withdrawn"

export type MyApplicationRow = {
  id: string
  status: ApplicationStatus
  created_at: string
  // After migration 0005, the embed resolves even for closed/archived calls.
  call: CastingCallRow | null
}

export async function getMyApplicationForCall(callId: string): Promise<{
  id: string
  status: ApplicationStatus
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Embed actor_profile to filter to current user (RLS already does this,
  // but the embed is necessary because casting_applications has no profile_id).
  const { data, error } = await supabase
    .from("casting_applications")
    .select("id, status, actor_profiles!inner(profile_id)")
    .eq("casting_call_id", callId)
    .eq("actor_profiles.profile_id", user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { id: data.id, status: data.status as ApplicationStatus }
}

export type ApplicantRow = {
  application_id: string
  status: ApplicationStatus
  applied_at: string
  actor_profile_id: string
  full_name: string | null
  headshot_url: string | null
  approved: boolean
  location: string | null
}

// Industry-side. Relies on RLS: call owner sees applications via
// `casting_applications_select_call_owner`, plus migration 0007's
// `actor_profiles_select_call_owner` for the embedded actor profile.
export async function listApplicantsForCall(
  callId: string,
): Promise<ApplicantRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("casting_applications")
    .select(
      `
        id,
        status,
        created_at,
        actor_profiles (
          id,
          headshot_url,
          location,
          visibility,
          approved_at,
          profiles ( full_name )
        )
      `,
    )
    .eq("casting_call_id", callId)
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((raw) => {
    const apRaw = (raw as { actor_profiles: unknown }).actor_profiles
    const ap = (() => {
      if (!apRaw) return null
      if (Array.isArray(apRaw))
        return (apRaw[0] ?? null) as Record<string, unknown> | null
      return apRaw as Record<string, unknown>
    })()
    const profileRaw = ap?.profiles
    const profile = (() => {
      if (!profileRaw) return null
      if (Array.isArray(profileRaw))
        return (profileRaw[0] ?? null) as { full_name: string | null } | null
      return profileRaw as { full_name: string | null }
    })()

    const approved =
      ap?.visibility === "public" && (ap as { approved_at: string | null })?.approved_at !== null

    return {
      application_id: raw.id as string,
      status: raw.status as ApplicationStatus,
      applied_at: raw.created_at as string,
      actor_profile_id: (ap?.id as string) ?? "",
      full_name: profile?.full_name ?? null,
      headshot_url: (ap?.headshot_url as string | null) ?? null,
      approved,
      location: (ap?.location as string | null) ?? null,
    }
  })
}

export async function listMyApplicationsWithCalls(): Promise<
  MyApplicationRow[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // RLS `casting_applications_select_actor` restricts to own; the inner join
  // on actor_profiles plus the .eq below scope it explicitly. Embed
  // casting_calls(...) to render the call title — relies on migration 0005.
  const { data, error } = await supabase
    .from("casting_applications")
    .select(
      `
        id,
        status,
        created_at,
        actor_profiles!inner ( profile_id ),
        casting_calls (
          id, title, production_company, project_type, union_status,
          pay_status, shoot_start, shoot_end, deadline, location,
          description, status, created_at
        )
      `,
    )
    .eq("actor_profiles.profile_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((raw) => {
    const callRaw = (raw as { casting_calls: unknown }).casting_calls
    const call = (() => {
      if (!callRaw) return null
      if (Array.isArray(callRaw))
        return (callRaw[0] ?? null) as CastingCallRow | null
      return callRaw as CastingCallRow
    })()
    return {
      id: raw.id as string,
      status: raw.status as ApplicationStatus,
      created_at: raw.created_at as string,
      call,
    }
  })
}
