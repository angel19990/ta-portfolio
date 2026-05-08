import "server-only"

import { createClient } from "@/lib/supabase/server"

export type CastingCallStatus = "draft" | "open" | "closed" | "archived"

export type CastingCallRow = {
  id: string
  title: string
  production_company: string | null
  project_type: string | null
  union_status: string | null
  pay_status: string | null
  shoot_start: string | null
  shoot_end: string | null
  deadline: string | null
  location: string | null
  description: string | null
  status: CastingCallStatus
  created_at: string
}

const CALL_COLUMNS =
  "id, title, production_company, project_type, union_status, pay_status, shoot_start, shoot_end, deadline, location, description, status, created_at"

// `casting_calls_select_open` lets any authenticated user see open rows, so we
// can't rely on RLS alone for an owner-only view — filter by created_by.
export async function listOwnCastingCalls(): Promise<CastingCallRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("casting_calls")
    .select(CALL_COLUMNS)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as CastingCallRow[]
}

export async function getOwnCastingCallById(
  id: string,
): Promise<CastingCallRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("casting_calls")
    .select(CALL_COLUMNS)
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle()

  if (error) throw error
  return (data as CastingCallRow | null) ?? null
}

// Student-side: all currently-open calls. RLS `casting_calls_select_open`
// already restricts to status='open' (plus owner/admin/applicant overlays
// that don't match this caller).
export async function listOpenCastingCalls(): Promise<CastingCallRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("casting_calls")
    .select(CALL_COLUMNS)
    .eq("status", "open")
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as CastingCallRow[]
}

// Student-side detail. Restricts to open calls, but the applicant overlay
// (0005) means a student who applied to a call that later closed can still
// fetch it via getCastingCallByIdAsApplicant below — used by the
// applications page, not the browse detail.
export async function getOpenCastingCallById(
  id: string,
): Promise<CastingCallRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("casting_calls")
    .select(CALL_COLUMNS)
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle()

  if (error) throw error
  return (data as CastingCallRow | null) ?? null
}
