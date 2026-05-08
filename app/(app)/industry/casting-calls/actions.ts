"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import {
  castingCallSchema,
  type CastingCallInput,
} from "@/lib/validators/casting-call"

export type CreateResult = { ok: true; id: string } | { error: string }

const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim())
const dateOrNull = (v: string) => (v === "" ? null : v)

export async function createCastingCall(
  input: CastingCallInput,
  deadlineISO: string | null,
): Promise<CreateResult> {
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
      status: "open",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  if (!data) return { error: "Insert returned no row" }

  revalidatePath("/industry/casting-calls")
  return { ok: true, id: data.id }
}
