"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
import { CastingCallSummary } from "@/components/shared/CastingCallSummary"
import { ApplyButton } from "@/components/student/ApplyButton"
import { WithdrawButton } from "@/components/student/WithdrawButton"
import {
  loadStudentCallContext,
  type StudentCallContext,
} from "@/app/(app)/student/casting-calls/actions"
import type { ApplicationStatus } from "@/lib/db/casting-applications"
import type { CastingCallRow } from "@/lib/db/casting-calls"
import { APPLICATION_STATUS_VARIANT as APP_STATUS_VARIANT } from "@/lib/ui/status-variants"

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
}

type Props = {
  call: CastingCallRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CastingCallStudentSidePanel({
  call,
  open,
  onOpenChange,
}: Props) {
  type ContextState = {
    forCallId: string
    loading: boolean
    payload: StudentCallContext | null
  } | null
  const [contextState, setContextState] = useState<ContextState>(null)

  const callId = call?.id ?? null
  const visibleContext =
    contextState && contextState.forCallId === callId
      ? contextState.payload
      : null
  const contextLoading =
    contextState != null &&
    contextState.forCallId === callId &&
    contextState.loading

  useEffect(() => {
    if (!callId) return
    let cancelled = false
    setContextState({ forCallId: callId, loading: true, payload: null })
    loadStudentCallContext(callId).then((result) => {
      if (cancelled) return
      setContextState((prev) => {
        if (!prev || prev.forCallId !== callId) return prev
        if ("error" in result) {
          toast.error(result.error)
          return { forCallId: callId, loading: false, payload: null }
        }
        return {
          forCallId: callId,
          loading: false,
          payload: result.context,
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
        <SheetContent className="w-full sm:max-w-xl" />
      </Sheet>
    )
  }

  const subline =
    [call.production_company, call.project_type].filter(Boolean).join(" · ") ||
    "—"
  const application = visibleContext?.application ?? null
  const canWithdraw =
    application !== null &&
    (application.status === "submitted" || application.status === "shortlisted")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle className="truncate text-xl font-semibold tracking-tight">{call.title}</SheetTitle>
          <SheetDescription className="truncate">{subline}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6 pt-4">
          <CastingCallSummary call={call} />

          <section className="border-t border-foreground/10 pt-5">
            {contextLoading && !visibleContext ? (
              <Skeleton className="h-9 w-44" />
            ) : !visibleContext ? null : application ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Your application</span>
                  <Badge variant={APP_STATUS_VARIANT[application.status]}>
                    {APP_STATUS_LABEL[application.status]}
                  </Badge>
                </div>
                {canWithdraw ? (
                  <WithdrawButton
                    applicationId={application.id}
                    callTitle={call.title}
                  />
                ) : null}
              </div>
            ) : !visibleContext.hasProfile ? (
              <div className="space-y-2">
                <Button type="button" disabled>
                  Apply to this call
                </Button>
                <p className="text-sm text-muted-foreground">
                  Complete your{" "}
                  <Link
                    href="/student/profile"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    talent profile
                  </Link>{" "}
                  first — casting calls require a profile to apply.
                </p>
              </div>
            ) : (
              <ApplyButton callId={call.id} />
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
