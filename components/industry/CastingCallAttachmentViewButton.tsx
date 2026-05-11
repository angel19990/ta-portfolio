"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getCastingCallAttachmentSignedUrl } from "@/app/(app)/industry/casting-calls/attachment-actions"

type Props = {
  callId: string
}

export function CastingCallAttachmentViewButton({ callId }: Props) {
  const [isPending, startTransition] = useTransition()

  function onView() {
    startTransition(async () => {
      const result = await getCastingCallAttachmentSignedUrl(callId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      window.open(result.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onView}
      disabled={isPending}
    >
      {isPending ? "Opening…" : "View attachment ↗"}
    </Button>
  )
}
