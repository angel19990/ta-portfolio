"use client"

import Link from "next/link"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setApplicationStatus } from "@/app/(app)/industry/casting-calls/actions"
import type {
  ApplicantRow,
  ApplicationStatus,
} from "@/lib/db/casting-applications"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
}

const APP_STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline"
> = {
  submitted: "default",
  shortlisted: "default",
  rejected: "outline",
  withdrawn: "outline",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ApplicantsTable({
  applicants,
  callId,
}: {
  applicants: ApplicantRow[]
  callId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function transition(
    applicationId: string,
    next: "submitted" | "shortlisted" | "rejected",
    label: string,
  ) {
    startTransition(async () => {
      const result = await setApplicationStatus(applicationId, next, callId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(label)
      router.refresh()
    })
  }

  if (applicants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No applicants yet.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Applicant</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applicants.map((a) => {
          const dimmed = a.status === "withdrawn"
          const name = a.full_name ?? "Unnamed actor"
          return (
            <TableRow key={a.application_id} className={dimmed ? "opacity-60" : undefined}>
              <TableCell>
                <div className="flex flex-col">
                  {a.approved && a.actor_profile_id ? (
                    <Link
                      href={`/industry/talent/${a.actor_profile_id}`}
                      className="font-medium hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="font-medium">{name}</span>
                  )}
                  {a.location ? (
                    <span className="text-xs text-muted-foreground">
                      {a.location}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={APP_STATUS_VARIANT[a.status]}>
                  {APP_STATUS_LABEL[a.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(a.applied_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {a.status === "submitted" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          transition(
                            a.application_id,
                            "shortlisted",
                            "Shortlisted",
                          )
                        }
                      >
                        Shortlist
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          transition(
                            a.application_id,
                            "rejected",
                            "Rejected",
                          )
                        }
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {a.status === "shortlisted" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        transition(a.application_id, "rejected", "Rejected")
                      }
                    >
                      Reject
                    </Button>
                  ) : null}
                  {a.status === "rejected" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        transition(
                          a.application_id,
                          "submitted",
                          "Reconsidering",
                        )
                      }
                    >
                      Reconsider
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
