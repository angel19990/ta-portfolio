import { z } from "zod"

export const castingCallSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    production_company: z.string().trim().max(200),
    project_type: z.string().trim().max(80),
    union_status: z.string().trim().max(80),
    pay_status: z.string().trim().max(80),
    location: z.string().trim().max(200),
    shoot_start: z.string().max(20),
    shoot_end: z.string().max(20),
    deadline: z.string().max(20),
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
