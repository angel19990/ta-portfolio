import Link from "next/link"

import { requireRole } from "@/lib/auth/require-role"
import { listOpenCastingCalls } from "@/lib/db/casting-calls"
import { PageHeader } from "@/components/layout/PageHeader"

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function StudentCastingCallsPage() {
  await requireRole("student")
  const calls = await listOpenCastingCalls()

  return (
    <>
      <PageHeader
        title="Casting calls"
        description="Open calls you can apply to."
      />
      {calls.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No open casting calls right now. Check back later.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {calls.map((c) => (
            <li key={c.id}>
              <Link
                href={`/student/casting-calls/${c.id}`}
                className="flex items-center justify-between gap-4 p-4 outline-none hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium">
                    {c.title}
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[c.production_company, c.project_type, c.location]
                      .filter(Boolean)
                      .join(" · ") || "—"}
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
