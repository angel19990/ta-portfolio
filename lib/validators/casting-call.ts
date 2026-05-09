import { z } from "zod"

// Form date fields use YYYY-MM-DD or empty string. Lexicographic compare in
// the refine works correctly only with this format. Deadline is a datetime-
// local but the page-level helper keeps it a YYYY-MM-DD here too — the action
// derives the ISO timestamp itself.
const dateOrEmpty = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD")

export const castingCallSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    production_company: z.string().trim().max(200),
    project_type: z.string().trim().max(80),
    union_status: z.string().trim().max(80),
    pay_status: z.string().trim().max(80),
    location: z.string().trim().max(200),
    shoot_start: dateOrEmpty,
    shoot_end: dateOrEmpty,
    deadline: dateOrEmpty,
    description: z.string().trim().max(5000),
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
  }
}
