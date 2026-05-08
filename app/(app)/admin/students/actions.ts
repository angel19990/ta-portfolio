"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export type EnrollResult = { ok: true } | { error: string }

export async function enrollStudentInSection(
  profileId: string,
  classSectionId: string,
): Promise<EnrollResult> {
  if (!profileId || !classSectionId) return { error: "Missing id" }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "admin") return { error: "Forbidden" }

  const supabase = await createClient()

  // Resolve outstanding from section override or class default.
  const { data: section, error: sectionError } = await supabase
    .from("class_sections")
    .select("price_cents, classes ( default_price_cents )")
    .eq("id", classSectionId)
    .single()
  if (sectionError) return { error: sectionError.message }
  if (!section) return { error: "Section not found" }

  const cls = (() => {
    const raw = (section as { classes: unknown }).classes
    if (!raw) return null
    if (Array.isArray(raw)) return raw[0] as { default_price_cents: number } | null
    return raw as { default_price_cents: number }
  })()
  const price =
    typeof section.price_cents === "number"
      ? section.price_cents
      : cls?.default_price_cents ?? 0

  const { error } = await supabase.from("student_classes").insert({
    profile_id: profileId,
    class_section_id: classSectionId,
    status: "enrolled",
    payment_status: price > 0 ? "unpaid" : "paid",
    amount_paid_cents: 0,
    outstanding_cents: price,
  })
  if (error) {
    if (error.code === "23505") {
      return { error: "Student is already enrolled in this section" }
    }
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { ok: true }
}
