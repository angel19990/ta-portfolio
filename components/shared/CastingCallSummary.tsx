import { Badge } from "@/components/ui/badge"
import type { CastingCallRow, CastingCallStatus } from "@/lib/db/casting-calls"

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

export function CastingCallSummary({ call }: { call: CastingCallRow }) {
  const shootDates =
    call.shoot_start && call.shoot_end
      ? `${formatDate(call.shoot_start)} – ${formatDate(call.shoot_end)}`
      : call.shoot_start
        ? formatDate(call.shoot_start)
        : null

  return (
    <div className="grid gap-6">
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
    </div>
  )
}
