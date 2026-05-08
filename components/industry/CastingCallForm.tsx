"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { createCastingCall } from "@/app/(app)/industry/casting-calls/actions"
import {
  castingCallSchema,
  type CastingCallInput,
} from "@/lib/validators/casting-call"
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

// "2026-06-01" → end-of-day local time, serialized to ISO. Parses as local
// (no `Z`/offset), then `.toISOString()` converts to UTC.
function localEndOfDayISO(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

export function CastingCallForm({
  initialValues,
}: {
  initialValues: CastingCallInput
}) {
  const router = useRouter()
  const form = useForm<CastingCallInput>({
    resolver: zodResolver(castingCallSchema),
    defaultValues: initialValues,
  })

  async function onSubmit(values: CastingCallInput) {
    const deadlineISO = values.deadline
      ? localEndOfDayISO(values.deadline)
      : null
    const result = await createCastingCall(values, deadlineISO)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success("Casting call posted")
    router.push("/industry/casting-calls")
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Lead role — indie feature"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="production_company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production company</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="project_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project type</FormLabel>
                <FormControl>
                  <Input placeholder="Feature, TV…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="union_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Union status</FormLabel>
                <FormControl>
                  <Input placeholder="Union, Non-Union…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pay_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pay</FormLabel>
                <FormControl>
                  <Input placeholder="Paid, Stipend…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Orlando, FL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="shoot_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shoot start</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shoot_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shoot end</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application deadline</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Roles, requirements, audition details."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Posting…" : "Post call"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
