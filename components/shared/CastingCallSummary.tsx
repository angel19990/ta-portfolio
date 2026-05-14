import { Badge } from "@/components/ui/badge"
import { CastingCallAttachmentViewButton } from "@/components/industry/CastingCallAttachmentViewButton"
import {
  CASTING_CALL_STATUS_LABEL as STATUS_LABEL,
  CASTING_CALL_STATUS_VARIANT as STATUS_VARIANT,
} from "@/lib/ui/status-variants"
import type { CastingCallRow } from "@/lib/db/casting-calls"

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
    <div className="flex flex-col gap-5">
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

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {call.location ? (
          <div>
            <dt className="sr-only">Location</dt>
            <dd>
              <span className="text-muted-foreground">Location</span>
              <span className="ml-1.5">{call.location}</span>
            </dd>
          </div>
        ) : null}
        {shootDates ? (
          <div>
            <dt className="sr-only">Shoot</dt>
            <dd>
              <span className="text-muted-foreground">Shoot</span>
              <span className="ml-1.5">{shootDates}</span>
            </dd>
          </div>
        ) : null}
        {call.deadline ? (
          <div>
            <dt className="sr-only">Apply by</dt>
            <dd>
              <span className="text-muted-foreground">Apply by</span>
              <span className="ml-1.5">{formatDate(call.deadline)}</span>
            </dd>
          </div>
        ) : null}
      </dl>

      {call.description ? (
        <div>
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {call.description}
          </p>
        </div>
      ) : null}

      {call.attachment_url ? (
        <div>
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Attachment
          </h2>
          <CastingCallAttachmentViewButton callId={call.id} />
        </div>
      ) : null}
    </div>
  )
}
