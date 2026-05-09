import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { EnrollmentRow } from "@/lib/db/student-classes"
import type { StudentNote } from "@/lib/db/student-notes"

export type StudentStatus =
  | "inactive"
  | "pending_approval"
  | "approved"
  | "private"

export type AdminStudentActor = {
  id: string
  headshot_url: string | null
  visibility: "private" | "public"
  approved_at: string | null
  bio: string | null
  location: string | null
  skills: string[] | null
  age: number | null
}

// List shape — slim, no enrollments/notes (those are lazy-loaded in the side
// panel). At ≥100 students with eager embeds, /admin's payload bloated even
// though the panel only renders detail for the *selected* row.
export type AdminStudent = {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  actor_profile: AdminStudentActor | null
  status: StudentStatus
}

// Detail shape returned by getStudentDetail — only fetched on side-panel open.
export type AdminStudentDetail = {
  enrollments: EnrollmentRow[]
  notes: StudentNote[]
}

// 1:1 embed normalizer: PostgREST may return either an object or a 1-element array.
function singleEmbed<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return (raw[0] ?? null) as T | null
  return raw as T
}

type RawEnrollment = {
  id: string
  status: EnrollmentRow["status"]
  payment_status: EnrollmentRow["payment_status"]
  amount_paid_cents: number
  outstanding_cents: number
  enrolled_at: string
  class_sections:
    | {
        id: string
        section_code: string
        term: string
        classes: { name: string; code: string | null } | null | unknown
      }
    | unknown
}

function mapEnrollment(raw: RawEnrollment): EnrollmentRow {
  const section = singleEmbed<{
    id: string
    section_code: string
    term: string
    classes: unknown
  }>(raw.class_sections)
  const cls = section
    ? singleEmbed<{ name: string; code: string | null }>(section.classes)
    : null
  return {
    id: raw.id,
    status: raw.status,
    payment_status: raw.payment_status,
    amount_paid_cents: raw.amount_paid_cents,
    outstanding_cents: raw.outstanding_cents,
    enrolled_at: raw.enrolled_at,
    section: section
      ? {
          id: section.id,
          section_code: section.section_code,
          term: section.term,
          class: cls,
        }
      : null,
  }
}

type RawNote = {
  id: string
  body: string
  created_at: string
  author: { id: string; full_name: string | null } | unknown
}

function mapNote(raw: RawNote): StudentNote {
  const author = singleEmbed<{ id: string; full_name: string | null }>(
    raw.author,
  )
  return {
    id: raw.id,
    body: raw.body,
    created_at: raw.created_at,
    author,
  }
}

export async function listStudentsForAdmin(): Promise<AdminStudent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        email,
        full_name,
        is_active,
        created_at,
        actor_profiles (
          id,
          headshot_url,
          visibility,
          approved_at,
          bio,
          location,
          skills,
          age
        )
      `,
    )
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) throw error
  if (!data) return []

  return data.map((row) => {
    const actorProfile = singleEmbed<AdminStudentActor>(
      (row as { actor_profiles: unknown }).actor_profiles,
    )

    let status: StudentStatus
    if (!row.is_active) status = "inactive"
    else if (!actorProfile) status = "private"
    else if (
      actorProfile.visibility === "public" &&
      !actorProfile.approved_at
    )
      status = "pending_approval"
    else if (actorProfile.approved_at) status = "approved"
    else status = "private"

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      is_active: row.is_active,
      created_at: row.created_at,
      actor_profile: actorProfile,
      status,
    }
  })
}

// On-demand detail fetch — fired when the side panel opens, not on the list.
export async function getStudentDetail(
  profileId: string,
): Promise<AdminStudentDetail> {
  const supabase = await createClient()
  const [enrollmentsResult, notesResult] = await Promise.all([
    supabase
      .from("student_classes")
      .select(
        `
          id,
          status,
          payment_status,
          amount_paid_cents,
          outstanding_cents,
          enrolled_at,
          class_sections (
            id,
            section_code,
            term,
            classes ( name, code )
          )
        `,
      )
      .eq("profile_id", profileId)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("student_notes")
      .select(
        `
          id,
          body,
          created_at,
          author:author_id ( id, full_name )
        `,
      )
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
  ])

  if (enrollmentsResult.error) throw enrollmentsResult.error
  if (notesResult.error) throw notesResult.error

  const enrollments: EnrollmentRow[] = (enrollmentsResult.data ?? []).map((e) =>
    mapEnrollment(e as RawEnrollment),
  )
  const notes: StudentNote[] = (notesResult.data ?? []).map((n) =>
    mapNote(n as RawNote),
  )

  return { enrollments, notes }
}
