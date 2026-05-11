import "server-only"

import { createClient } from "@/lib/supabase/server"

export type AdminClassRow = {
  id: string
  name: string
  code: string | null
  description: string | null
  level: string | null
  default_price_cents: number
  is_active: boolean
  section_count: number
  created_at: string
}

export type ClassSectionRow = {
  id: string
  class_id: string
  section_code: string
  term: string
  start_date: string | null
  end_date: string | null
  capacity: number | null
  price_cents: number | null
  is_active: boolean
}

const CLASS_COLUMNS =
  "id, name, code, description, level, default_price_cents, is_active, created_at, class_sections(count)"

export async function listClassesForAdmin(): Promise<AdminClassRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("classes")
    .select(CLASS_COLUMNS)
    .order("name", { ascending: true })

  if (error) throw error
  if (!data) return []

  return data.map((raw) => {
    const sectionsRaw = (raw as { class_sections: unknown }).class_sections
    const count = (() => {
      if (Array.isArray(sectionsRaw)) {
        const first = sectionsRaw[0] as { count: number } | undefined
        return first?.count ?? 0
      }
      if (sectionsRaw && typeof sectionsRaw === "object") {
        return ((sectionsRaw as { count: number }).count ?? 0) as number
      }
      return 0
    })()

    const { class_sections: _c, ...rest } = raw as Record<string, unknown> & {
      class_sections: unknown
    }
    return {
      ...(rest as unknown as Omit<AdminClassRow, "section_count">),
      section_count: count,
    }
  })
}

export async function listSectionsForClass(
  classId: string,
): Promise<ClassSectionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_sections")
    .select(
      "id, class_id, section_code, term, start_date, end_date, capacity, price_cents, is_active",
    )
    .eq("class_id", classId)
    .order("term", { ascending: false })
    .order("section_code", { ascending: true })

  if (error) throw error
  return (data ?? []) as ClassSectionRow[]
}
