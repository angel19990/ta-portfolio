import Link from "next/link"

import { requireRole } from "@/lib/auth/require-role"
import { listOpenCastingCalls } from "@/lib/db/casting-calls"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/PageHeader"
import { StudentCastingCallsListClient } from "@/components/student/StudentCastingCallsListClient"

export default async function StudentCastingCallsPage() {
  const me = await requireRole("student")

  const supabase = await createClient()
  const [calls, actorRowResult] = await Promise.all([
    listOpenCastingCalls(),
    supabase
      .from("actor_profiles")
      .select("id")
      .eq("profile_id", me.id)
      .maybeSingle(),
  ])
  const hasProfile = actorRowResult.data !== null

  return (
    <>
      <PageHeader
        title="Casting calls"
        description="Open calls you can apply to."
      />

      {!hasProfile ? (
        <div className="mb-4 rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
          <p className="font-medium">Complete your profile to apply.</p>
          <p className="mt-1 text-muted-foreground">
            You can browse calls, but you'll need a{" "}
            <Link
              href="/student/profile"
              className="text-foreground underline-offset-4 hover:underline"
            >
              talent profile
            </Link>{" "}
            before you can submit an application.
          </p>
        </div>
      ) : null}

      {calls.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No open casting calls right now. Check back later.
        </div>
      ) : (
        <StudentCastingCallsListClient calls={calls} />
      )}
    </>
  )
}
