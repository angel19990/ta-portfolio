"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { setCastingCallStatus } from "@/app/(app)/industry/casting-calls/actions"
import type { CastingCallStatus } from "@/lib/db/casting-calls"
import { Button } from "@/components/ui/button"

const TRANSITION_LABEL: Partial<
  Record<CastingCallStatus, { close?: string; reopen?: string; archive: string }>
> = {
  draft: { archive: "Archive" },
  open: { close: "Close call", archive: "Archive" },
  closed: { reopen: "Re-open", archive: "Archive" },
  archived: { archive: "Archive" }, // unused — archived hides all transitions
}

export function CastingCallStatusActions({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: CastingCallStatus
}) {
  const [pending, startTransition] = useTransition()

  function transition(next: CastingCallStatus, label: string) {
    startTransition(async () => {
      const result = await setCastingCallStatus(id, next)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(label)
    })
  }

  if (currentStatus === "archived") return null
  const labels = TRANSITION_LABEL[currentStatus]
  if (!labels) return null

  return (
    <>
      {labels.close ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => transition("closed", "Call closed")}
        >
          {labels.close}
        </Button>
      ) : null}
      {labels.reopen ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => transition("open", "Call re-opened")}
        >
          {labels.reopen}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => transition("archived", "Call archived")}
      >
        {labels.archive}
      </Button>
    </>
  )
}
