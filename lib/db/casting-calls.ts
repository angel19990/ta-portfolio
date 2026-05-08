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
    .select(
      "id, title, production_company, project_type, union_status, pay_status, shoot_start, shoot_end, deadline, location, description, status, created_at",
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as CastingCallRow[]
}
