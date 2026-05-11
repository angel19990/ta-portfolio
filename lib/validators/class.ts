import { z } from "zod"

export const classSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  code: z.string().trim().max(40).default(""),
  description: z.string().trim().max(2000).default(""),
  level: z.string().trim().max(80).default(""),
  default_price_cents: z
    .number({ error: "Price must be a number" })
    .int()
    .min(0)
    .max(1_000_000_00),
  is_active: z.boolean(),
})

export type ClassInput = z.infer<typeof classSchema>

export function emptyClass(): ClassInput {
  return {
    name: "",
    code: "",
    description: "",
    level: "",
    default_price_cents: 0,
    is_active: true,
  }
}
