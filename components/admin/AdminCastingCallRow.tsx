"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setCastingCallStatus } from "@/app/(app)/industry/casting-calls/actions"
import type {
  AdminCastingCallRow as AdminCallRow,
  CastingCallStatus,
} from "@/lib/db/casting-calls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TableCell, TableRow } from "@/components/ui/table"

const STATUS_LABEL: Record<CastingCallStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
}

const STATUS_VARIANT: Record<
  CastingCallStatus,
  "default" | "secondary" | "outline"
> = {
  open: "default",
  draft: "secondary",
  closed: "outline",
  archived: "outline",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function AdminCastingCallRow({ call }: { call: AdminCallRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await setCastingCallStatus(call.id, "archived")
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Call archived")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <TableRow>
      <TableCell>
        <span className="font-medium">{call.title}</span>
        {call.production_company ? (
          <p className="text-xs text-muted-foreground">
            {call.production_company}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="text-sm">
        {call.owner_full_name ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[call.status]}>
          {STATUS_LABEL[call.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{call.applicant_count}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(call.created_at)}
      </TableCell>
      <TableCell className="text-right">
        {call.status !== "archived" ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              Archive
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Archive this casting call?</DialogTitle>
                  <DialogDescription>
                    Archiving{" "}
                    <span className="font-medium">{call.title}</span> hides
                    it from everyone except the owner. The owner can&apos;t
                    re-open it from the UI.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={pending}
                  >
                    {pending ? "Archiving…" : "Archive"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
