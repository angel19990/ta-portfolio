"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { teacherFromSectionCode } from "@/lib/teachers"
import type { AvailableSection } from "@/lib/db/student-classes"
import { enrollStudentInSection } from "@/app/(app)/admin/students/actions"

type Props = {
  profileId: string
  studentName: string
  sections: AvailableSection[]
  excludeSectionIds?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClassToStudentDialog({
  profileId,
  studentName,
  sections,
  excludeSectionIds = [],
  open,
  onOpenChange,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [sectionId, setSectionId] = useState<string>("")

  const exclude = new Set(excludeSectionIds)
  const available = sections.filter((s) => !exclude.has(s.id))

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sectionId) return
    startTransition(async () => {
      const result = await enrollStudentInSection(profileId, sectionId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Class added")
      setSectionId("")
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add class</DialogTitle>
          <DialogDescription>
            Enroll {studentName} in an active section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="section">Section</Label>
            {available.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                {sections.length === 0
                  ? "No active sections. Add one via seed-classes.mjs."
                  : "Already enrolled in every active section."}
              </p>
            ) : (
              <Select
                value={sectionId}
                onValueChange={(next) => setSectionId(next ?? "")}
              >
                <SelectTrigger id="section" className="w-full">
                  <SelectValue placeholder="Pick a section…" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {formatSectionLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !sectionId || available.length === 0}
            >
              {isPending ? "Adding…" : "Add class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatSectionLabel(s: AvailableSection): string {
  const className = s.class?.name ?? s.section_code
  const teacher = teacherFromSectionCode(s.section_code)
  const price = (s.price_cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const parts = [className, s.section_code]
  if (teacher) parts.push(teacher)
  parts.push(price)
  return parts.join(" · ")
}
