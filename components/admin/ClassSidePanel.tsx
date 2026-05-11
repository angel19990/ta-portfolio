"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { loadSectionsForClass } from "@/app/(app)/admin/classes/actions"
import type { AdminClassRow, ClassSectionRow } from "@/lib/db/classes"
import { ClassFormDialog } from "@/components/admin/ClassFormDialog"
import { SectionFormDialog } from "@/components/admin/SectionFormDialog"

type Props = {
  classRow: AdminClassRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAfterChange?: () => void
}

export function ClassSidePanel({
  classRow,
  open,
  onOpenChange,
  onAfterChange,
}: Props) {
  type DetailState = {
    forClassId: string
    loading: boolean
    sections: ClassSectionRow[]
  } | null
  const [detail, setDetail] = useState<DetailState>(null)
  const [editClassOpen, setEditClassOpen] = useState(false)
  const [sectionFormOpen, setSectionFormOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<ClassSectionRow | null>(
    null,
  )

  const classId = classRow?.id ?? null
  const visibleSections =
    detail && detail.forClassId === classId ? detail.sections : []
  const loading =
    detail != null && detail.forClassId === classId && detail.loading

  const refreshSections = useCallback(async (id: string) => {
    setDetail({ forClassId: id, loading: true, sections: [] })
    const result = await loadSectionsForClass(id)
    setDetail((prev) => {
      if (!prev || prev.forClassId !== id) return prev
      if ("error" in result) {
        toast.error(result.error)
        return { forClassId: id, loading: false, sections: [] }
      }
      return { forClassId: id, loading: false, sections: result.sections }
    })
  }, [])

  useEffect(() => {
    if (!classId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSections(classId)
  }, [classId, refreshSections])

  if (!classRow) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{classRow.name}</SheetTitle>
              <SheetDescription className="truncate">
                {classRow.code ?? "—"}
                {classRow.level ? ` · ${classRow.level}` : ""}
              </SheetDescription>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant={classRow.is_active ? "secondary" : "outline"}>
                  {classRow.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Default {formatCents(classRow.default_price_cents)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditClassOpen(true)}
            >
              Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {classRow.description ? (
            <section>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {classRow.description}
              </p>
            </section>
          ) : null}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sections
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingSection(null)
                  setSectionFormOpen(true)
                }}
              >
                Add section
              </Button>
            </div>
            {loading && visibleSections.length === 0 ? (
              <Skeleton className="h-12 w-full" />
            ) : visibleSections.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No sections yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {visibleSections.map((s) => (
                  <li key={s.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {s.section_code}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.term}
                          {s.start_date ? ` · ${s.start_date}` : ""}
                          {s.end_date ? ` – ${s.end_date}` : ""}
                          {typeof s.capacity === "number"
                            ? ` · Cap ${s.capacity}`
                            : ""}
                          {typeof s.price_cents === "number"
                            ? ` · ${formatCents(s.price_cents)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.is_active ? "secondary" : "outline"}>
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSection(s)
                            setSectionFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>

      <ClassFormDialog
        open={editClassOpen}
        onOpenChange={setEditClassOpen}
        editing={classRow}
        onAfterSubmit={() => onAfterChange?.()}
      />
      <SectionFormDialog
        open={sectionFormOpen}
        onOpenChange={(next) => {
          setSectionFormOpen(next)
          if (!next) setEditingSection(null)
        }}
        classId={classRow.id}
        editing={editingSection}
        onAfterSubmit={() => {
          refreshSections(classRow.id)
          onAfterChange?.()
        }}
      />
    </Sheet>
  )
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
