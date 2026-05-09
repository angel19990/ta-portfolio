"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import type { CastingCallStatus } from "@/lib/db/casting-calls"
import {
  castingCallSchema,
  type CastingCallInput,
} from "@/lib/validators/casting-call"

export type CreateResult = { ok: true; id: string } | { error: string }
export type UpdateResult = { ok: true; id: string } | { error: string }
export type StatusResult = { ok: true } | { error: string }
export type ApplicationStatusResult = { ok: true } | { error: string }

const VALID_APPLICATION_STATUSES = [
  "submitted",
  "shortlisted",
  "rejected",
] as const
type IndustryAssignableStatus = (typeof VALID_APPLICATION_STATUSES)[number]

const VALID_STATUSES: CastingCallStatus[] = [
  "draft",
  "open",
  "closed",
  "archived",
]

const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim())
const dateOrNull = (v: string) => (v === "" ? null : v)

export async function createCastingCall(
  input: CastingCallInput,
  deadlineISO: string | null,
  status: "draft" | "open",
): Promise<CreateResult> {
  if (status !== "draft" && status !== "open") {
    return { error: "Invalid status" }
  }
  const parsed = castingCallSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("casting_calls")
    .insert({
      created_by: me.id,
      title: v.title,
      production_company: emptyToNull(v.production_company),
      project_type: emptyToNull(v.project_type),
      union_status: emptyToNull(v.union_status),
      pay_status: emptyToNull(v.pay_status),
      location: emptyToNull(v.location),
      shoot_start: dateOrNull(v.shoot_start),
      shoot_end: dateOrNull(v.shoot_end),
      deadline: deadlineISO,
      description: emptyToNull(v.description),
      status,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  if (!data) return { error: "Insert returned no row" }

  revalidatePath("/industry/casting-calls")
  return { ok: true, id: data.id }
}

export async function updateCastingCall(
  id: string,
  input: CastingCallInput,
  deadlineISO: string | null,
  status: CastingCallStatus,
): Promise<UpdateResult> {
  if (!id) return { error: "Missing id" }
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status" }

  const parsed = castingCallSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const v = parsed.data

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  const supabase = await createClient()
  // RLS (`casting_calls_update_owner` / `_admin`) enforces ownership server-side.
  const { error } = await supabase
    .from("casting_calls")
    .update({
      title: v.title,
      production_company: emptyToNull(v.production_company),
      project_type: emptyToNull(v.project_type),
      union_status: emptyToNull(v.union_status),
      pay_status: emptyToNull(v.pay_status),
      location: emptyToNull(v.location),
      shoot_start: dateOrNull(v.shoot_start),
      shoot_end: dateOrNull(v.shoot_end),
      deadline: deadlineISO,
      description: emptyToNull(v.description),
      status,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/industry/casting-calls")
  revalidatePath(`/industry/casting-calls/${id}`)
  revalidatePath(`/industry/casting-calls/${id}/edit`)
  return { ok: true, id }
}

export async function setApplicationStatus(
  applicationId: string,
  newStatus: IndustryAssignableStatus,
  callId: string,
): Promise<ApplicationStatusResult> {
  if (!applicationId) return { error: "Missing application id" }
  if (!callId) return { error: "Missing call id" }
  if (
    !(VALID_APPLICATION_STATUSES as readonly string[]).includes(newStatus)
  ) {
    return { error: "Invalid status" }
  }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  const supabase = await createClient()

  // Block transitions out of 'withdrawn' (student-driven terminal state).
  // RLS doesn't gate by current status, so enforce here.
  const { data: existing, error: readError } = await supabase
    .from("casting_applications")
    .select("status")
    .eq("id", applicationId)
    .maybeSingle()
  if (readError) return { error: readError.message }
  if (!existing) return { error: "Application not found" }
  if (existing.status === "withdrawn") {
    return { error: "Withdrawn applications can't be reassigned." }
  }

  // RLS `casting_applications_update_call_owner` enforces ownership
  // server-side.
  const { error } = await supabase
    .from("casting_applications")
    .update({ status: newStatus })
    .eq("id", applicationId)

  if (error) return { error: error.message }

  revalidatePath(`/industry/casting-calls/${callId}`)
  return { ok: true }
}

export async function setCastingCallStatus(
  id: string,
  status: CastingCallStatus,
): Promise<StatusResult> {
  if (!id) return { error: "Missing id" }
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "industry_user" && me.role !== "admin") {
    return { error: "Forbidden" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("casting_calls")
    .update({ status })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/industry/casting-calls")
  revalidatePath(`/industry/casting-calls/${id}`)
  return { ok: true }
}
