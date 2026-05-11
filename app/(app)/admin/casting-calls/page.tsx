import { requireRole } from "@/lib/auth/require-role"
import { listAllCastingCallsForAdmin } from "@/lib/db/casting-calls"
import { PageHeader } from "@/components/layout/PageHeader"
import { AdminCastingCallsListClient } from "@/components/admin/AdminCastingCallsListClient"

export default async function AdminCastingCallsPage() {
  await requireRole("admin")
  const calls = await listAllCastingCallsForAdmin()

  return (
    <>
      <PageHeader
        title="Casting calls"
        description="Every call across the network. Archive force-removes a call from the platform."
      />
      {calls.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No casting calls to review.
        </div>
      ) : (
        <AdminCastingCallsListClient calls={calls} />
      )}
    </>
  )
}
