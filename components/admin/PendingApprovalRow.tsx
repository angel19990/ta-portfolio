"use client"

import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { approveActor } from "@/app/(app)/admin/approvals/actions"
import { transformedImage } from "@/lib/util/storage-image"

type Props = {
  id: string
  fullName: string | null
  email: string
  headshotUrl: string | null
  bio: string | null
  location: string | null
}

export function PendingApprovalRow({
  id,
  fullName,
  email,
  headshotUrl,
  bio,
  location,
}: Props) {
  const [isPending, startTransition] = useTransition()

  function onApprove() {
    startTransition(async () => {
      const result = await approveActor(id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`Approved ${fullName ?? email}`)
    })
  }

  return (
    <li className="flex items-start gap-4 border-t border-foreground/10 pt-4 pb-4 first:border-0 first:pt-0">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {headshotUrl ? (
          <Image
            src={transformedImage(headshotUrl, { width: 160 })!}
            alt={fullName ?? email}
            fill
            sizes="64px"
            className="object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No headshot
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium">{fullName ?? "Unnamed"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {email}
          {location ? ` · ${location}` : ""}
        </p>
        {bio ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{bio}</p>
        ) : (
          <p className="text-xs italic text-muted-foreground">No bio yet</p>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onApprove}
        disabled={isPending}
      >
        {isPending ? "Approving…" : "Approve"}
      </Button>
    </li>
  )
}
