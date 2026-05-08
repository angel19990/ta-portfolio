"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import type { PaymentStatus } from "@/lib/db/student-classes"

export type EnrollResult = { ok: true } | { error: string }
export type PaymentResult = { ok: true } | { error: string }
export type NoteResult = { ok: true } | { error: string }

const NOTE_MAX_LENGTH = 5000

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

export async function recordPayment(
  enrollmentId: string,
  amountCents: number,
): Promise<PaymentResult> {
  if (!enrollmentId) return { error: "Missing id" }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { error: "Amount must be a positive whole number of cents" }
  }
  // Sanity cap: $100k. Catches typos like extra zeros.
  if (amountCents > 10_000_000) {
    return { error: "Amount looks too large — double-check the value" }
  }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "admin") return { error: "Forbidden" }

  const supabase = await createClient()

  const { data: row, error: readError } = await supabase
    .from("student_classes")
    .select("amount_paid_cents, outstanding_cents")
    .eq("id", enrollmentId)
    .single()
  if (readError) return { error: readError.message }
  if (!row) return { error: "Enrollment not found" }

  const newPaid = row.amount_paid_cents + amountCents
  const newOutstanding = Math.max(0, row.outstanding_cents - amountCents)
  const newStatus: PaymentStatus =
    newOutstanding === 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid"

  const { error } = await supabase
    .from("student_classes")
    .update({
      amount_paid_cents: newPaid,
      outstanding_cents: newOutstanding,
      payment_status: newStatus,
    })
    .eq("id", enrollmentId)
  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { ok: true }
}

export async function addStudentNote(
  profileId: string,
  body: string,
): Promise<NoteResult> {
  if (!profileId) return { error: "Missing student id" }
  const trimmed = body.trim()
  if (trimmed.length === 0) return { error: "Note can’t be empty" }
  if (trimmed.length > NOTE_MAX_LENGTH) {
    return { error: `Note can’t exceed ${NOTE_MAX_LENGTH} characters` }
  }

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "admin") return { error: "Forbidden" }

  const supabase = await createClient()
  const { error } = await supabase.from("student_notes").insert({
    profile_id: profileId,
    author_id: me.id,
    body: trimmed,
  })
  if (error) return { error: error.message }

  revalidatePath("/admin")
  return { ok: true }
}
