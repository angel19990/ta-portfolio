import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth/require-role"
import { getOwnCastingCallById } from "@/lib/db/casting-calls"
import type { CastingCallRow } from "@/lib/db/casting-calls"
import { PageHeader } from "@/components/layout/PageHeader"
import { CastingCallForm } from "@/components/industry/CastingCallForm"
import type { CastingCallInput } from "@/lib/validators/casting-call"

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

function rowToFormValues(row: CastingCallRow): CastingCallInput {
  return {
    title: row.title,
    production_company: row.production_company ?? "",
    project_type: row.project_type ?? "",
    union_status: row.union_status ?? "",
    pay_status: row.pay_status ?? "",
    location: row.location ?? "",
    shoot_start: row.shoot_start ?? "",
    shoot_end: row.shoot_end ?? "",
    deadline: row.deadline ? isoToLocalDateString(row.deadline) : "",
    description: row.description ?? "",
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
