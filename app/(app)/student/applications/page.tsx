import Link from "next/link"

import { requireRole } from "@/lib/auth/require-role"
import {
  listMyApplicationsWithCalls,
  type ApplicationStatus,
} from "@/lib/db/casting-applications"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
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

export default async function StudentApplicationsPage() {
  await requireRole("student")
  const apps = await listMyApplicationsWithCalls()

  return (
    <>
      <PageHeader
        title="Your applications"
        description="Casting calls you've applied to."
      />
      {apps.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          You haven&apos;t applied to anything yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {apps.map((a) => {
            const title = a.call?.title ?? "(call no longer available)"
            const subtitle = a.call
              ? [a.call.production_company, a.call.project_type]
                  .filter(Boolean)
                  .join(" · ") || null
              : null
            return (
              <li key={a.id}>
                <Link
                  href={
                    a.call ? `/student/casting-calls/${a.call.id}` : "#"
                  }
                  className="flex items-center justify-between gap-4 p-4 outline-none hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-disabled={!a.call}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{title}</span>
                      <Badge variant={APP_STATUS_VARIANT[a.status]}>
                        {APP_STATUS_LABEL[a.status]}
                      </Badge>
                    </div>
                    {subtitle ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    Applied {formatDate(a.created_at)}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
