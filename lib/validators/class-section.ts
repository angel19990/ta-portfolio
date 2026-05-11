import { z } from "zod"

const dateOrEmpty = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD")

export const classSectionSchema = z
  .object({
    section_code: z.string().trim().min(1, "Section code is required").max(60),
    term: z.string().trim().min(1, "Term is required").max(40),
    start_date: dateOrEmpty,
    end_date: dateOrEmpty,
    capacity: z
      .number({ error: "Capacity must be a number" })
      .int()
      .min(0)
      .max(10_000)
      .nullable(),
    price_cents: z
      .number({ error: "Price must be a number" })
      .int()
      .min(0)
      .max(1_000_000_00)
      .nullable(),
    is_active: z.boolean(),
  })
  .refine(
    (v) => !v.start_date || !v.end_date || v.end_date >= v.start_date,
    { message: "End date can't be before start date", path: ["end_date"] },
  )

export type ClassSectionInput = z.infer<typeof classSectionSchema>

export function emptyClassSection(): ClassSectionInput {
  return {
    section_code: "",
    term: "",
    start_date: "",
    end_date: "",
    capacity: null,
    price_cents: null,
    is_active: true,
  }
}
