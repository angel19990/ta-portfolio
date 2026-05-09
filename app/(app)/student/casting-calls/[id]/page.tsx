import Link from "next/link"
import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth/require-role"
import { getOpenCastingCallById } from "@/lib/db/casting-calls"
import {
  getMyApplicationForCall,
  type ApplicationStatus,
} from "@/lib/db/casting-applications"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CastingCallSummary } from "@/components/shared/CastingCallSummary"
import { ApplyButton } from "@/components/student/ApplyButton"
import { WithdrawButton } from "@/components/student/WithdrawButton"

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
}

const APP_STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  submitted: "default",
  shortlisted: "default",
  rejected: "outline",
  withdrawn: "outline",
}

type Params = Promise<{ id: string }>

export default async function StudentCastingCallDetailPage({
  params,
}: {
  params: Params
}) {
  const me = await requireRole("student")
  const { id } = await params

  const supabase = await createClient()
  // Run the three reads in parallel: getOpenCastingCallById is a single
  // Supabase query, the actor_profile lookup is another, and the application
  // lookup is the third. Each is gated by RLS and uses the user's session.
  const [call, actorRowResult, application] = await Promise.all([
    getOpenCastingCallById(id),
    supabase
      .from("actor_profiles")
      .select("id")
      .eq("profile_id", me.id)
      .maybeSingle(),
    getMyApplicationForCall(id, me.id),
  ])
  if (!call) notFound()
  const actorRow = actorRowResult.data
  const canWithdraw =
    application !== null &&
    (application.status === "submitted" ||
      application.status === "shortlisted")

  return (
    <>
      <PageHeader
        title={call.title}
        description={
          [call.production_company, call.project_type]
            .filter(Boolean)
            .join(" · ") || undefined
        }
      />

      <div className="grid max-w-2xl gap-6">
        <CastingCallSummary call={call} />

        <section className="rounded-lg border p-6">
          {application ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Your application</span>
                <Badge variant={APP_STATUS_VARIANT[application.status]}>
                  {APP_STATUS_LABEL[application.status]}
                </Badge>
              </div>
              {canWithdraw ? (
                <WithdrawButton
                  applicationId={application.id}
                  callTitle={call.title}
                />
              ) : null}
            </div>
          ) : !actorRow ? (
            <div className="space-y-2">
              <Button type="button" disabled>
                Apply to this call
              </Button>
              <p className="text-sm text-muted-foreground">
                Complete your{" "}
                <Link
                  href="/student/profile"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  talent profile
                </Link>{" "}
                first — casting calls require a profile to apply.
              </p>
            </div>
          ) : (
            <ApplyButton callId={call.id} />
          )}
        </section>

        <div>
          <Link
            href="/student/casting-calls"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to casting calls
          </Link>
        </div>
      </div>
    </>
  )
}
