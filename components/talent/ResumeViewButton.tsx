"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getActorResumeSignedUrl } from "@/app/(app)/talent/actions"

type Props = {
  actorProfileId: string
}

export function ResumeViewButton({ actorProfileId }: Props) {
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await getActorResumeSignedUrl(actorProfileId)
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
      onClick={onClick}
      disabled={isPending}
    >
      {isPending ? "Opening…" : "View resume"}
    </Button>
  )
}
