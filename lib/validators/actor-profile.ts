import { z } from "zod"

export const ETHNICITY_OPTIONS = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Pacific Islander",
  "White",
  "Two or more races",
  "Prefer not to say",
] as const

const ethnicitySchema = z.union([z.enum(ETHNICITY_OPTIONS), z.literal("")])

export const actorProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  location: z.string().trim().max(200),
  ethnicity: ethnicitySchema,
  bio: z.string().trim().max(2000),
  skills: z.array(z.string().trim().min(1).max(40)).max(30),
  current_job: z.string().trim().max(200),
  favorite_movies: z.string().trim().max(500),
  favorite_series: z.string().trim().max(500),
})

export type TalentProfileInput = z.infer<typeof actorProfileSchema>

export function emptyActorProfile(): TalentProfileInput {
  return {
    full_name: "",
    location: "",
    ethnicity: "",
    bio: "",
    skills: [],
    current_job: "",
    favorite_movies: "",
    favorite_series: "",
  }
}
