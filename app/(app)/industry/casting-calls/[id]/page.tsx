import Link from "next/link"
import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth/require-role"
import { getOwnCastingCallById } from "@/lib/db/casting-calls"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CastingCallStatusActions } from "@/components/industry/CastingCallStatusActions"
import type { CastingCallStatus } from "@/lib/db/casting-calls"

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

// Handles both Postgres `date` ("YYYY-MM-DD") and `timestamptz` (ISO).
// Plain date strings are parsed as local — `new Date("2026-07-10")` would
// otherwise resolve to UTC midnight and shift one day earlier in negative TZs.
function formatDate(s: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, opts)
  }
  return new Date(s).toLocaleDateString(undefined, opts)
}

type Params = Promise<{ id: string }>

export default async function CastingCallDetailPage({
  params,
}: {
  params: Params
}) {
  await requireRole("industry_user")
  const { id } = await params
  const call = await getOwnCastingCallById(id)
  if (!call) notFound()

  const shootDates =
    call.shoot_start && call.shoot_end
      ? `${formatDate(call.shoot_start)} – ${formatDate(call.shoot_end)}`
      : call.shoot_start
        ? formatDate(call.shoot_start)
        : null

  return (
    <>
      <PageHeader
        title={call.title}
        description={
          [call.production_company, call.project_type]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        actions={
          <>
            <Button
              nativeButton={false}
              variant="outline"
              render={
                <Link href={`/industry/casting-calls/${call.id}/edit`} />
              }
            >
              Edit
            </Button>
            <CastingCallStatusActions
              id={call.id}
              currentStatus={call.status}
            />
          </>
        }
      />

      <div className="grid max-w-2xl gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[call.status]}>
            {STATUS_LABEL[call.status]}
          </Badge>
          {call.union_status ? (
            <Badge variant="outline">{call.union_status}</Badge>
          ) : null}
          {call.pay_status ? (
            <Badge variant="outline">{call.pay_status}</Badge>
          ) : null}
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {call.location ? (
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="text-sm">{call.location}</dd>
            </div>
          ) : null}
          {shootDates ? (
            <div>
              <dt className="text-xs text-muted-foreground">Shoot</dt>
              <dd className="text-sm">{shootDates}</dd>
            </div>
          ) : null}
          {call.deadline ? (
            <div>
              <dt className="text-xs text-muted-foreground">
                Application deadline
              </dt>
              <dd className="text-sm">{formatDate(call.deadline)}</dd>
            </div>
          ) : null}
        </dl>

        {call.description ? (
          <div>
            <h2 className="mb-2 text-sm font-medium">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {call.description}
            </p>
          </div>
        ) : null}

        <section className="rounded-lg border p-6">
          <h2 className="text-sm font-medium">Applicants</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Applicants table lands in Phase 4 Task 4.
          </p>
        </section>

        <div>
          <Link
            href="/industry/casting-calls"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to your casting calls
          </Link>
        </div>
      </div>
    </>
  )
}
