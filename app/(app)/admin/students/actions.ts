"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth/get-user"
import { friendlyError } from "@/lib/util/friendly-error"
import type { PaymentStatus } from "@/lib/db/student-classes"
import { inviteUserSchema } from "@/lib/validators/invite-user"

export type EnrollResult = { ok: true } | { error: string }
export type PaymentResult = { ok: true } | { error: string }
export type NoteResult = { ok: true } | { error: string }
export type InviteResult = { ok: true; userId: string } | { error: string }

export type InvitableRole = "student" | "industry_user"

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
  if (sectionError) return { error: friendlyError(sectionError) }
  if (!section) return { error: "Section not found" }

  const cls = (() => {
    const raw = (section as { classes: unknown }).classes
    if (!raw) return null
    if (Array.isArray(raw))
      return raw[0] as { default_price_cents: number | null } | null
    return raw as { default_price_cents: number | null }
  })()
  const sectionPrice = section.price_cents
  const classDefault = cls?.default_price_cents
  // If neither price is set, refuse to enroll — silently flipping the row to
  // payment_status='paid' would let a misconfigured section give a free pass.
  if (
    (sectionPrice === null || sectionPrice === undefined) &&
    (classDefault === null || classDefault === undefined)
  ) {
    return { error: "Section has no price configured" }
  }
  const price =
    typeof sectionPrice === "number" ? sectionPrice : classDefault ?? 0

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
    return { error: friendlyError(error) }
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
  if (readError) return { error: friendlyError(readError) }
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
  if (error) return { error: friendlyError(error) }

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
  if (error) return { error: friendlyError(error) }

  revalidatePath("/admin")
  return { ok: true }
}

export async function inviteUser(input: {
  email: string
  fullName: string
  role: InvitableRole
}): Promise<InviteResult> {
  const parsed = inviteUserSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const { email, fullName, role } = parsed.data

  const me = await getCurrentUser()
  if (!me) return { error: "Not signed in" }
  if (me.role !== "admin") return { error: "Forbidden" }

  const admin = createAdminClient()

  // Pre-check email collision before issuing the invite — avoids the orphan
  // auth.users row we'd otherwise have to clean up on profile-insert failure.
  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existingError) return { error: friendlyError(existingError) }
  if (existing) return { error: "A user with that email already exists" }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=/create-password`,
      data: { full_name: fullName || null },
    },
  )
  if (inviteError) return { error: friendlyError(inviteError) }

  const userId = data.user?.id
  if (!userId) return { error: "Invite returned no user id" }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    role,
    full_name: fullName || null,
    invited_by: me.id,
    is_active: true,
  })

  if (profileError) {
    // Best-effort rollback: don't leave an orphaned auth user. Log if the
    // cleanup itself fails so an operator can finish it manually.
    await admin.auth.admin.deleteUser(userId).catch((rollbackError) => {
      console.error("invite rollback failed", { userId, error: rollbackError })
    })
    return { error: friendlyError(profileError, "Could not finish creating the user") }
  }

  revalidatePath("/admin")
  return { ok: true, userId }
}
