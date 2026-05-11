"use client"

import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  createCastingCall,
  updateCastingCall,
} from "@/app/(app)/industry/casting-calls/actions"
import type { CastingCallStatus } from "@/lib/db/casting-calls"
import {
  castingCallSchema,
  PROJECT_TYPE_OPTIONS,
  UNION_STATUS_OPTIONS,
  PAY_STATUS_OPTIONS,
  type CastingCallInput,
} from "@/lib/validators/casting-call"
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
import { CastingCallAttachmentUpload } from "@/components/industry/CastingCallAttachmentUpload"

// "2026-06-01" → end-of-day local time, serialized to ISO. Parses as local
// (no `Z`/offset), then `.toISOString()` converts to UTC.
function localEndOfDayISO(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

function todayISODate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const MAX_DATE = "2099-12-31"

type FormProps = {
  initialValues: CastingCallInput
  // When provided (modal mode), called after a successful submit with the
  // new/updated call id. The form does NOT navigate in that case — the
  // caller decides what to do (close sheet + refresh, etc).
  onSuccess?: (id: string, status: CastingCallStatus) => void
} & (
  | { mode: "create" }
  | { mode: "edit"; id: string; currentStatus: CastingCallStatus }
)

export function CastingCallForm(props: FormProps) {
  const { initialValues, mode, onSuccess } = props
  const router = useRouter()
  const form = useForm<CastingCallInput>({
    resolver: zodResolver(castingCallSchema),
    defaultValues: initialValues,
  })

  // In edit mode for a draft, allow either keeping draft or promoting to open.
  // In edit mode for any other status, status is preserved (single Save button).
  const showDraftAndPost =
    mode === "create" ||
    (mode === "edit" && props.currentStatus === "draft")

  async function doSubmit(
    values: CastingCallInput,
    nextStatus: CastingCallStatus,
  ) {
    const deadlineISO = values.deadline
      ? localEndOfDayISO(values.deadline)
      : null

    if (mode === "create") {
      const result = await createCastingCall(
        values,
        deadlineISO,
        nextStatus as "draft" | "open",
      )
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(
        nextStatus === "draft" ? "Draft saved" : "Casting call posted",
      )
      if (onSuccess) {
        onSuccess(result.id, nextStatus)
      } else {
        router.push("/industry/casting-calls")
        router.refresh()
      }
    } else {
      const result = await updateCastingCall(
        props.id,
        values,
        deadlineISO,
        nextStatus,
      )
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(
        props.currentStatus === "draft" && nextStatus === "open"
          ? "Casting call posted"
          : "Saved",
      )
      if (onSuccess) {
        onSuccess(props.id, nextStatus)
      } else {
        router.push("/industry/casting-calls")
        router.refresh()
      }
    }
  }

  const submitWith = (status: CastingCallStatus) =>
    form.handleSubmit((values) => doSubmit(values, status))

  const submitting = form.formState.isSubmitting
  const today = todayISODate()
  // useWatch is compiler-safe (vs form.watch which trips a React Compiler skip).
  const shootStartValue = useWatch({ control: form.control, name: "shoot_start" })
  const attachmentValue = useWatch({ control: form.control, name: "attachment_url" })

  return (
    <Form {...form}>
      <form
        onSubmit={
          showDraftAndPost
            ? submitWith("open")
            : submitWith(
                mode === "edit"
                  ? props.currentStatus
                  : ("open" as CastingCallStatus),
              )
        }
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
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
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
            name="union_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Union status</FormLabel>
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
                    {UNION_STATUS_OPTIONS.map((opt) => (
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
            name="pay_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pay</FormLabel>
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
                    {PAY_STATUS_OPTIONS.map((opt) => (
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
                  <Input
                    type="date"
                    min={today}
                    max={MAX_DATE}
                    placeholder="YYYY-MM-DD"
                    {...field}
                  />
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
                  <Input
                    type="date"
                    min={shootStartValue || today}
                    max={MAX_DATE}
                    placeholder="YYYY-MM-DD"
                    {...field}
                  />
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
                  <Input
                    type="date"
                    min={today}
                    max={MAX_DATE}
                    placeholder="YYYY-MM-DD"
                    {...field}
                  />
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

        <CastingCallAttachmentUpload
          value={attachmentValue ?? ""}
          onChange={(path) =>
            form.setValue("attachment_url", path, { shouldDirty: true })
          }
        />

        <div className="flex flex-wrap gap-2">
          {showDraftAndPost ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={submitWith("draft")}
              >
                Save as draft
              </Button>
              {/* type="submit" so Enter inside an input also fires this path
                  (the form's onSubmit is wired to submitWith('open') above). */}
              <Button type="submit" disabled={submitting}>
                {mode === "create"
                  ? submitting
                    ? "Posting…"
                    : "Post call"
                  : submitting
                    ? "Posting…"
                    : "Save & post"}
              </Button>
            </>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
