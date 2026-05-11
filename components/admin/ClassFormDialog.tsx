"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  createClass,
  updateClass,
} from "@/app/(app)/admin/classes/actions"
import {
  classSchema,
  emptyClass,
  type ClassInput,
} from "@/lib/validators/class"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { AdminClassRow } from "@/lib/db/classes"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When provided, edit mode. Otherwise create.
  editing?: AdminClassRow | null
  onAfterSubmit?: () => void
}

export function ClassFormDialog({
  open,
  onOpenChange,
  editing,
  onAfterSubmit,
}: Props) {
  const initial: ClassInput = editing
    ? {
        name: editing.name,
        code: editing.code ?? "",
        description: editing.description ?? "",
        level: editing.level ?? "",
        default_price_cents: editing.default_price_cents,
        is_active: editing.is_active,
      }
    : emptyClass()

  const form = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: initial,
  })

  async function onSubmit(values: ClassInput) {
    const result = editing
      ? await updateClass(editing.id, values)
      : await createClass(values)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success(editing ? "Class updated" : "Class created")
    onAfterSubmit?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit class" : "New class"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the class catalog entry. Existing sections aren't affected."
              : "Add a class to the catalog. Sections come next."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Voice Class" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. V1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Beginner, Advanced" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="default_price_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default price (cents)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value),
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <FormLabel className="m-0">Active</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create class"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
