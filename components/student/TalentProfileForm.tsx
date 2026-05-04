"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { saveTalentProfile } from "@/app/(app)/student/profile/actions"
import {
  actorProfileSchema,
  type TalentProfileInput,
} from "@/lib/validators/actor-profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  const router = useRouter()
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
    router.refresh()
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
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={120}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
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
          name="birthplace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthplace</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
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
          name="reel_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reel URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
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
