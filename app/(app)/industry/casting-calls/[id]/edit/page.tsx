import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth/require-role"
import { getOwnCastingCallById } from "@/lib/db/casting-calls"
import type { CastingCallRow } from "@/lib/db/casting-calls"
import { PageHeader } from "@/components/layout/PageHeader"
import { CastingCallForm } from "@/components/industry/CastingCallForm"
import {
  PAY_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  UNION_STATUS_OPTIONS,
  type CastingCallInput,
} from "@/lib/validators/casting-call"

// Reverse of localEndOfDayISO: ISO timestamp → "YYYY-MM-DD" in the server's
// local TZ. Acceptable for MVP — drift between server and casting director's
// browser TZ would be at most one day in edge cases.
function isoToLocalDateString(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Pre-existing rows may hold values that aren't in the current enum set;
// fall back to "" so the form renders the placeholder instead of crashing.
function narrow<T extends string>(
  value: string | null,
  options: readonly T[],
): T | "" {
  if (!value) return ""
  return (options as readonly string[]).includes(value) ? (value as T) : ""
}

function rowToFormValues(row: CastingCallRow): CastingCallInput {
  return {
    title: row.title,
    production_company: row.production_company ?? "",
    project_type: narrow(row.project_type, PROJECT_TYPE_OPTIONS),
    union_status: narrow(row.union_status, UNION_STATUS_OPTIONS),
    pay_status: narrow(row.pay_status, PAY_STATUS_OPTIONS),
    location: row.location ?? "",
    shoot_start: row.shoot_start ?? "",
    shoot_end: row.shoot_end ?? "",
    deadline: row.deadline ? isoToLocalDateString(row.deadline) : "",
    description: row.description ?? "",
    attachment_url: row.attachment_url ?? "",
  }
}

type Params = Promise<{ id: string }>

export default async function EditCastingCallPage({
  params,
}: {
  params: Params
}) {
  await requireRole("industry_user")
  const { id } = await params
  const call = await getOwnCastingCallById(id)
  if (!call) notFound()

  return (
    <>
      <PageHeader
        title="Edit casting call"
        description={call.title}
      />
      <CastingCallForm
        mode="edit"
        id={call.id}
        currentStatus={call.status}
        initialValues={rowToFormValues(call)}
      />
    </>
  )
}
