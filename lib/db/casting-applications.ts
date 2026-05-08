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
