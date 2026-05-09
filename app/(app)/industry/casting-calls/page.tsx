import Link from "next/link"

import { requireRole } from "@/lib/auth/require-role"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  listOwnCastingCalls,
  type CastingCallStatus,
} from "@/lib/db/casting-calls"

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

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function IndustryCastingCallsPage() {
  await requireRole("industry_user")
  const calls = await listOwnCastingCalls()

  return (
    <>
      <PageHeader
        title="Your casting calls"
        description="Calls you have posted, including drafts."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/industry/casting-calls/new" />}
          >
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
              <Link
                href={`/industry/casting-calls/${c.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
