import { z } from "zod"

export const actorProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  age: z
    .number({ error: "Age must be a number" })
    .int()
    .min(0)
    .max(120)
    .nullable(),
  location: z.string().trim().max(200),
  birthplace: z.string().trim().max(200),
  bio: z.string().trim().max(2000),
  skills: z.array(z.string().trim().min(1).max(40)).max(30),
  reel_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || z.url().safeParse(v).success,
      { message: "Must be a valid URL" },
    ),
})

export type TalentProfileInput = z.infer<typeof actorProfileSchema>

export function emptyActorProfile(): TalentProfileInput {
  return {
    full_name: "",
    age: null,
    location: "",
    birthplace: "",
    bio: "",
    skills: [],
    reel_url: "",
  }
}
