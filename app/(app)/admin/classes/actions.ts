"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { friendlyError } from "@/lib/util/friendly-error"
import { classSchema, type ClassInput } from "@/lib/validators/class"
import {
  classSectionSchema,
  type ClassSectionInput,
} from "@/lib/validators/class-section"
import type { ClassSectionRow } from "@/lib/db/classes"

export type CreateClassResult = { ok: true; id: string } | { error: string }
export type UpdateClassResult = { ok: true } | { error: string }
export type CreateSectionResult = { ok: true; id: string } | { error: string }
export type UpdateSectionResult = { ok: true } | { error: string }
export type LoadSectionsResult =
  | { sections: ClassSectionRow[] }
  | { error: string }

const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim())
const dateOrNull = (v: string) => (v === "" ? null : v)

type AdminCheckResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<AdminCheckResult> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: "Not signed in" }
  if (me.role !== "admin") return { ok: false, error: "Forbidden" }
  return { ok: true }
}

export async function createClass(
  input: ClassInput,
): Promise<CreateClassResult> {
  const parsed = classSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const v = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("classes")
    .insert({
      name: v.name,
      code: emptyToNull(v.code),
      description: emptyToNull(v.description),
      level: emptyToNull(v.level),
      default_price_cents: v.default_price_cents,
      is_active: v.is_active,
    })
    .select("id")
    .single()

  if (error) return { error: friendlyError(error) }
  if (!data) return { error: "Insert returned no row" }

  revalidatePath("/admin")
  return { ok: true, id: data.id }
}

export async function updateClass(
  id: string,
  input: ClassInput,
): Promise<UpdateClassResult> {
  if (!id) return { error: "Missing id" }
  const parsed = classSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from("classes")
    .update({
      name: v.name,
      code: emptyToNull(v.code),
      description: emptyToNull(v.description),
      level: emptyToNull(v.level),
      default_price_cents: v.default_price_cents,
      is_active: v.is_active,
    })
    .eq("id", id)

  if (error) return { error: friendlyError(error) }
  revalidatePath("/admin")
  return { ok: true }
}

export async function loadSectionsForClass(
  classId: string,
): Promise<LoadSectionsResult> {
  if (!classId) return { error: "Missing class id" }
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_sections")
    .select(
      "id, class_id, section_code, term, start_date, end_date, capacity, price_cents, is_active",
    )
    .eq("class_id", classId)
    .order("term", { ascending: false })
    .order("section_code", { ascending: true })

  if (error) return { error: friendlyError(error) }
  return { sections: (data ?? []) as ClassSectionRow[] }
}

export async function createSection(
  classId: string,
  input: ClassSectionInput,
): Promise<CreateSectionResult> {
  if (!classId) return { error: "Missing class id" }
  const parsed = classSectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const v = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_sections")
    .insert({
      class_id: classId,
      section_code: v.section_code,
      term: v.term,
      start_date: dateOrNull(v.start_date),
      end_date: dateOrNull(v.end_date),
      capacity: v.capacity,
      price_cents: v.price_cents,
      is_active: v.is_active,
    })
    .select("id")
    .single()

  if (error) return { error: friendlyError(error) }
  if (!data) return { error: "Insert returned no row" }

  revalidatePath("/admin")
  return { ok: true, id: data.id }
}

export async function updateSection(
  id: string,
  input: ClassSectionInput,
): Promise<UpdateSectionResult> {
  if (!id) return { error: "Missing id" }
  const parsed = classSectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from("class_sections")
    .update({
      section_code: v.section_code,
      term: v.term,
      start_date: dateOrNull(v.start_date),
      end_date: dateOrNull(v.end_date),
      capacity: v.capacity,
      price_cents: v.price_cents,
      is_active: v.is_active,
    })
    .eq("id", id)

  if (error) return { error: friendlyError(error) }
  revalidatePath("/admin")
  return { ok: true }
}
