"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { saveTalentProfile } from "@/app/(app)/student/profile/actions"
import {
  actorProfileSchema,
  ETHNICITY_OPTIONS,
  type TalentProfileInput,
} from "@/lib/validators/actor-profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const skillsToString = (skills: string[]) => skills.join(", ")
const stringToSkills = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0)

export function TalentProfileForm({
  initialValues,
}: {
  initialValues: TalentProfileInput
}) {
  const [skillsInput, setSkillsInput] = React.useState(
    skillsToString(initialValues.skills),
  )

  const form = useForm<TalentProfileInput>({
    resolver: zodResolver(actorProfileSchema),
    defaultValues: initialValues,
  })

  async function onSubmit(values: TalentProfileInput) {
    const result = await saveTalentProfile(values)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success("Profile saved")
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid max-w-2xl gap-6"
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Orlando, FL"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ethnicity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ethnicity</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ETHNICITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Short bio for casting professionals."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input
                  placeholder="comma-separated, e.g. Improv, Stage Combat, Spanish"
                  value={skillsInput}
                  onChange={(e) => {
                    setSkillsInput(e.target.value)
                    field.onChange(stringToSkills(e.target.value))
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="current_job"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Job</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Barista at Starbucks"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favorite_movies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Movies</FormLabel>
              <FormControl>
                <Input
                  placeholder="Comma separated, e.g. La La Land, Inception, Heat"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favorite_series"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Series</FormLabel>
              <FormControl>
                <Input
                  placeholder="Comma separated, e.g. Succession, The Bear, Fleabag"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
