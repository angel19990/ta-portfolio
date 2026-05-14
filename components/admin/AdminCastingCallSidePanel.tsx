"use client"

import { useEffect, useState, useTransition } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CastingCallSummary } from "@/components/shared/CastingCallSummary"
import { ApplicantsTable } from "@/components/industry/ApplicantsTable"
import {
  loadApplicantsForCall,
  setCastingCallStatus,
} from "@/app/(app)/industry/casting-calls/actions"
import type { ApplicantRow } from "@/lib/db/casting-applications"
import type { AdminCastingCallRow } from "@/lib/db/casting-calls"
import {
  CASTING_CALL_STATUS_LABEL as STATUS_LABEL,
  CASTING_CALL_STATUS_VARIANT as STATUS_VARIANT,
} from "@/lib/ui/status-variants"

type Props = {
  call: AdminCastingCallRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminCastingCallSidePanel({ call, open, onOpenChange }: Props) {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  type ApplicantsState = {
    forCallId: string
    loading: boolean
    payload: ApplicantRow[] | null
  } | null
  const [applicantsState, setApplicantsState] = useState<ApplicantsState>(null)
  const callId = call?.id ?? null
  const visibleApplicants =
    applicantsState && applicantsState.forCallId === callId
      ? applicantsState.payload
      : null
  const applicantsLoading =
    applicantsState != null &&
    applicantsState.forCallId === callId &&
    applicantsState.loading

  useEffect(() => {
    if (!callId) return
    let cancelled = false
    setApplicantsState({ forCallId: callId, loading: true, payload: null })
    loadApplicantsForCall(callId).then((result) => {
      if (cancelled) return
      setApplicantsState((prev) => {
        if (!prev || prev.forCallId !== callId) return prev
        if ("error" in result) {
          toast.error(result.error)
          return { forCallId: callId, loading: false, payload: null }
        }
        return {
          forCallId: callId,
          loading: false,
          payload: result.applicants,
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [callId])

  if (!call) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl" />
      </Sheet>
    )
  }

  function onArchive() {
    if (!call) return
    startTransition(async () => {
      const result = await setCastingCallStatus(call.id, "archived")
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Call archived")
      setArchiveOpen(false)
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="border-b">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-xl font-semibold tracking-tight">{call.title}</SheetTitle>
              <SheetDescription className="truncate">
                {call.production_company ?? "—"}
                {call.owner_full_name
                  ? ` · Owner: ${call.owner_full_name}`
                  : ""}
              </SheetDescription>
              <div className="mt-1.5">
                <Badge variant={STATUS_VARIANT[call.status]}>
                  {STATUS_LABEL[call.status]}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6 pt-4">
          <CastingCallSummary call={call} />

          {call.status !== "archived" ? (
            <section className="flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setArchiveOpen(true)}
              >
                Archive
              </Button>
              <p className="text-xs text-muted-foreground">
                Archiving hides this call from everyone except the owner.
              </p>
            </section>
          ) : null}

          <section className="border-t border-foreground/10 pt-5">
            <h2 className="mb-3 flex items-baseline gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Applicants
              <span className="text-muted-foreground/70">
                ({call.applicant_count})
              </span>
            </h2>
            {applicantsLoading && !visibleApplicants ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !visibleApplicants ? (
              <p className="text-sm text-muted-foreground">
                Could not load applicants.
              </p>
            ) : (
              <ApplicantsTable
                applicants={visibleApplicants}
                callId={call.id}
              />
            )}
          </section>
        </div>
      </SheetContent>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive this casting call?</DialogTitle>
            <DialogDescription>
              Archiving <span className="font-medium">{call.title}</span> hides
              it from everyone except the owner. The owner can&apos;t re-open
              it from the UI.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onArchive}
              disabled={pending}
            >
              {pending ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
