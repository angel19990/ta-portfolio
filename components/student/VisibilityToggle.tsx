"use client"

import { useId, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"
import { setVisibility } from "@/app/(app)/student/profile/visibility-actions"

type Props = {
  visibility: "public" | "private"
  approvedAt: string | null
}

export function VisibilityToggle({ visibility, approvedAt }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const id = useId()

  const isPublic = visibility === "public"
  const isApproved = !!approvedAt

  // What does industry actually see?
  const industryStatus = isPublic && isApproved
    ? { label: "Visible to industry", tone: "text-foreground" }
    : isPublic && !isApproved
      ? { label: "Public, awaiting admin approval", tone: "text-muted-foreground" }
      : { label: "Private — only you and admin can see this", tone: "text-muted-foreground" }

  function onCheckedChange(next: boolean) {
    const nextVisibility = next ? "public" : "private"
    startTransition(async () => {
      const result = await setVisibility(nextVisibility)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(next ? "Set to public" : "Set to private")
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium cursor-pointer">
          Profile visibility
        </label>
        <p className={`text-xs ${industryStatus.tone}`}>{industryStatus.label}</p>
      </div>
      <Switch
        id={id}
        checked={isPublic}
        onCheckedChange={onCheckedChange}
        disabled={isPending}
        aria-label="Make profile public"
      />
    </div>
  )
}
