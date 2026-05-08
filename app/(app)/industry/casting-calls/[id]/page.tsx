import Link from "next/link"
import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth/require-role"
import { getOwnCastingCallById } from "@/lib/db/casting-calls"
import { listApplicantsForCall } from "@/lib/db/casting-applications"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { CastingCallSummary } from "@/components/shared/CastingCallSummary"
import { CastingCallStatusActions } from "@/components/industry/CastingCallStatusActions"
import { ApplicantsTable } from "@/components/industry/ApplicantsTable"

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

  const applicants = await listApplicantsForCall(id)

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
        <CastingCallSummary call={call} />

        <section className="space-y-3 rounded-lg border p-6">
          <h2 className="text-sm font-medium">
            Applicants{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              ({applicants.length})
            </span>
          </h2>
          <ApplicantsTable applicants={applicants} callId={call.id} />
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
