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

// Default page size for list views — bumps to a "load more" UI later if needed.
const LIST_LIMIT = 50

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
    .limit(LIST_LIMIT)

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
    .limit(LIST_LIMIT)

  if (error) throw error
  return (data ?? []) as CastingCallRow[]
}

export type AdminCastingCallRow = CastingCallRow & {
  owner_full_name: string | null
  applicant_count: number
}

// Admin moderation. Admin sees all calls via `casting_calls_select_admin`.
export async function listAllCastingCallsForAdmin(): Promise<
  AdminCastingCallRow[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("casting_calls")
    .select(
      `
        id, title, production_company, project_type, union_status,
        pay_status, shoot_start, shoot_end, deadline, location,
        description, status, created_at,
        owner:created_by ( full_name ),
        casting_applications ( count )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)

  if (error) throw error
  if (!data) return []

  return data.map((raw) => {
    const ownerRaw = (raw as { owner: unknown }).owner
    const owner = (() => {
      if (!ownerRaw) return null
      if (Array.isArray(ownerRaw))
        return (ownerRaw[0] ?? null) as { full_name: string | null } | null
      return ownerRaw as { full_name: string | null }
    })()
    const countRaw = (raw as { casting_applications: unknown })
      .casting_applications
    const count = (() => {
      if (!countRaw) return 0
      if (Array.isArray(countRaw)) {
        const first = countRaw[0] as { count: number } | undefined
        return first?.count ?? 0
      }
      return ((countRaw as { count: number }).count ?? 0) as number
    })()

    const { owner: _o, casting_applications: _c, ...rest } = raw as Record<
      string,
      unknown
    > & {
      owner: unknown
      casting_applications: unknown
    }
    return {
      ...(rest as unknown as CastingCallRow),
      owner_full_name: owner?.full_name ?? null,
      applicant_count: count,
    }
  })
}

// Student-side detail. Restricts to open calls.
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
