import { requireRole } from "@/lib/auth/require-role"
import { listOwnCastingCalls } from "@/lib/db/casting-calls"
import { CastingCallsListClient } from "@/components/industry/CastingCallsListClient"

export default async function IndustryCastingCallsPage() {
  await requireRole("industry_user")
  const calls = await listOwnCastingCalls()

  return <CastingCallsListClient calls={calls} />
}
