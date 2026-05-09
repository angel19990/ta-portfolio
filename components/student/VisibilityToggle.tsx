"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { setVisibility } from "@/app/(app)/student/profile/visibility-actions"

type Props = {
  visibility: "public" | "private"
  approvedAt: string | null
}

export function VisibilityToggle({ visibility, approvedAt }: Props) {
  const [isPending, startTransition] = useTransition()

  const isPublic = visibility === "public"
  const isApproved = !!approvedAt

  // What does industry actually see?
  const industryStatus = isPublic && isApproved
    ? { label: "Visible to industry", tone: "text-foreground" }
    : isPublic && !isApproved
      ? { label: "Public, awaiting admin approval", tone: "text-muted-foreground" }
      : { label: "Private — only you and admin can see this", tone: "text-muted-foreground" }

  function onToggle() {
    const next = isPublic ? "private" : "public"
    startTransition(async () => {
      const result = await setVisibility(next)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(next === "public" ? "Set to public" : "Set to private")
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Profile visibility</p>
        <p className={`text-xs ${industryStatus.tone}`}>{industryStatus.label}</p>
      </div>
      <Button
        type="button"
        variant={isPublic ? "outline" : "default"}
        size="sm"
        onClick={onToggle}
        disabled={isPending}
      >
        {isPending ? "Saving…" : isPublic ? "Make private" : "Make public"}
      </Button>
    </div>
  )
}
