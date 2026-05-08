import { requireRole } from "@/lib/auth/require-role"
import { PageHeader } from "@/components/layout/PageHeader"
import { CastingCallForm } from "@/components/industry/CastingCallForm"
import { emptyCastingCall } from "@/lib/validators/casting-call"

export default async function NewCastingCallPage() {
  await requireRole("industry_user")

  return (
    <>
      <PageHeader
        title="Post a casting call"
        description="Posts open immediately. You can close or archive it later."
      />
      <CastingCallForm initialValues={emptyCastingCall()} />
    </>
  )
}
