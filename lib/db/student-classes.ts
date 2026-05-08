import "server-only"

import { createClient } from "@/lib/supabase/server"

export type EnrollmentStatus = "enrolled" | "completed" | "dropped"
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded"

export type EnrollmentRow = {
  id: string
  status: EnrollmentStatus
  payment_status: PaymentStatus
  amount_paid_cents: number
  outstanding_cents: number
  enrolled_at: string
  section: {
    id: string
    section_code: string
    term: string
    class: {
      name: string
      code: string | null
    } | null
  } | null
}

export type AvailableSection = {
  id: string
  section_code: string
  term: string
  price_cents: number
  class: {
    name: string
    code: string | null
  } | null
}

// 1:1 embed normalizer (PostgREST may return either an object or 1-element array)
function singleEmbed<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return (raw[0] ?? null) as T | null
  return raw as T
}

export async function listAvailableSections(): Promise<AvailableSection[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_sections")
    .select(
      `
        id,
        section_code,
        term,
        price_cents,
        classes ( name, code, default_price_cents )
      `,
    )
    .eq("is_active", true)
    .order("term", { ascending: false })
    .order("section_code", { ascending: true })

  if (error) throw error
  if (!data) return []

  return data.map((row) => {
    const cls = singleEmbed<{
      name: string
      code: string | null
      default_price_cents: number
    }>((row as { classes: unknown }).classes)
    const resolvedPrice =
      typeof row.price_cents === "number"
        ? row.price_cents
        : cls?.default_price_cents ?? 0
    return {
      id: row.id,
      section_code: row.section_code,
      term: row.term,
      price_cents: resolvedPrice,
      class: cls ? { name: cls.name, code: cls.code } : null,
    }
  })
}
