"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CastingCallForm } from "@/components/industry/CastingCallForm"
import { CastingCallSummary } from "@/components/shared/CastingCallSummary"
import { CastingCallStatusActions } from "@/components/industry/CastingCallStatusActions"
import { ApplicantsTable } from "@/components/industry/ApplicantsTable"
import { loadApplicantsForCall } from "@/app/(app)/industry/casting-calls/actions"
import type { ApplicantRow } from "@/lib/db/casting-applications"
import {
  emptyCastingCall,
  type CastingCallInput,
} from "@/lib/validators/casting-call"
import type { CastingCallRow } from "@/lib/db/casting-calls"
import {
  CASTING_CALL_STATUS_LABEL as STATUS_LABEL,
  CASTING_CALL_STATUS_VARIANT as STATUS_VARIANT,
} from "@/lib/ui/status-variants"

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type Props = {
  calls: CastingCallRow[]
}

export function CastingCallsListClient({ calls }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId
    ? calls.find((c) => c.id === selectedId) ?? null
    : null

  // Lazy-load applicants for the selected call. Keyed by callId so a stale
  // fetch resolving after the user switched rows can't show old data.
  type ApplicantsState = {
    forCallId: string
    loading: boolean
    payload: ApplicantRow[] | null
  } | null
  const [applicantsState, setApplicantsState] = useState<ApplicantsState>(null)
  const visibleApplicants =
    applicantsState && applicantsState.forCallId === selectedId
      ? applicantsState.payload
      : null
  const applicantsLoading =
    applicantsState != null &&
    applicantsState.forCallId === selectedId &&
    applicantsState.loading

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setApplicantsState({ forCallId: selectedId, loading: true, payload: null })
    loadApplicantsForCall(selectedId).then((result) => {
      if (cancelled) return
      setApplicantsState((prev) => {
        if (!prev || prev.forCallId !== selectedId) return prev
        if ("error" in result) {
          toast.error(result.error)
          return { forCallId: selectedId, loading: false, payload: null }
        }
        return {
          forCallId: selectedId,
          loading: false,
          payload: result.applicants,
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  // Auto-open the create Sheet when arriving with ?new=1 (e.g. a redirect from
  // somewhere that wants to deep-link the create flow). Strip the query so
  // Back doesn't re-pop it.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true)
      router.replace("/industry/casting-calls")
    }
  }, [searchParams, router])

  const initialValues: CastingCallInput = emptyCastingCall()

  return (
    <>
      <PageHeader
        title="Your casting calls"
        description="Calls you have posted, including drafts."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Post a call
          </Button>
        }
      />
      {calls.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No casting calls yet. Create your first one.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {calls.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{c.title}</span>
                    <Badge variant={STATUS_VARIANT[c.status]}>
                      {STATUS_LABEL[c.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[c.project_type, c.location].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {c.deadline
                    ? `Apply by ${formatDeadline(c.deadline)}`
                    : "No deadline"}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b">
            <SheetTitle>Post a casting call</SheetTitle>
            <SheetDescription>
              Posts open immediately. You can close or archive it later.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 pt-4">
            <CastingCallForm
              mode="create"
              initialValues={initialValues}
              onSuccess={() => {
                setCreateOpen(false)
                router.refresh()
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          {selected ? (
            <>
              <SheetHeader className="border-b">
                <SheetTitle className="truncate">{selected.title}</SheetTitle>
                <SheetDescription className="truncate">
                  {[selected.production_company, selected.project_type]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-4">
                <CastingCallSummary call={selected} />

                <section className="flex flex-wrap items-center gap-2 rounded-lg border p-4">
                  <Button
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={`/industry/casting-calls/${selected.id}/edit`}
                      />
                    }
                  >
                    Edit
                  </Button>
                  <CastingCallStatusActions
                    id={selected.id}
                    currentStatus={selected.status}
                  />
                </section>

                <section>
                  <h2 className="mb-2 text-sm font-medium">
                    Applicants{" "}
                    {visibleApplicants ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({visibleApplicants.length})
                      </span>
                    ) : null}
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
                      callId={selected.id}
                    />
                  )}
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
