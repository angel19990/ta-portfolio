import { z } from "zod"

export const inviteUserSchema = z.object({
  email: z
    .email("Enter a valid email")
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  fullName: z
    .string()
    .trim()
    .max(200, "Name can’t exceed 200 characters")
    .default(""),
  role: z.enum(["student", "industry_user"]),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
