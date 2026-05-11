import { z } from "zod"

// Form date fields use YYYY-MM-DD or empty string. Lexicographic compare in
// the refine works correctly only with this format. Deadline is a datetime-
// local but the page-level helper keeps it a YYYY-MM-DD here too — the action
// derives the ISO timestamp itself.
const dateOrEmpty = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD")

export const PROJECT_TYPE_OPTIONS = [
  "Feature",
  "TV",
  "Commercial",
  "Theater",
  "Short",
  "Other",
] as const

export const UNION_STATUS_OPTIONS = [
  "Union",
  "Non-Union",
  "Either",
] as const

export const PAY_STATUS_OPTIONS = [
  "Paid",
  "Unpaid",
  "Stipend",
  "Deferred",
] as const

// Empty string is allowed (column is nullable; the action strips empties to null).
const projectTypeSchema = z.union([
  z.enum(PROJECT_TYPE_OPTIONS),
  z.literal(""),
])
const unionStatusSchema = z.union([
  z.enum(UNION_STATUS_OPTIONS),
  z.literal(""),
])
const payStatusSchema = z.union([
  z.enum(PAY_STATUS_OPTIONS),
  z.literal(""),
])

export const castingCallSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    production_company: z.string().trim().max(200),
    project_type: projectTypeSchema,
    union_status: unionStatusSchema,
    pay_status: payStatusSchema,
    location: z.string().trim().max(200),
    shoot_start: dateOrEmpty,
    shoot_end: dateOrEmpty,
    deadline: dateOrEmpty,
    description: z.string().trim().max(5000),
    attachment_url: z.string().trim().max(1000),
  })
  .refine(
    (v) => !v.shoot_start || !v.shoot_end || v.shoot_end >= v.shoot_start,
    { message: "Shoot end can't be before shoot start", path: ["shoot_end"] },
  )

export type CastingCallInput = z.infer<typeof castingCallSchema>

export function emptyCastingCall(): CastingCallInput {
  return {
    title: "",
    production_company: "",
    project_type: "",
    union_status: "",
    pay_status: "",
    location: "",
    shoot_start: "",
    shoot_end: "",
    deadline: "",
    description: "",
    attachment_url: "",
  }
}
