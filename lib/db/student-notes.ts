// student_notes are admin-only (per RLS). Eagerly embedded into
// listStudentsForAdmin alongside enrollments — no separate query needed at
// MVP scale.

export type StudentNote = {
  id: string
  body: string
  created_at: string
  author: {
    id: string
    full_name: string | null
  } | null
}
