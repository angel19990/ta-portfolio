import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function IndustryCastingCallsPage() {
  await requireRole("industry_user");

  return (
    <>
      <PageHeader
        title="Your casting calls"
        description="Calls you have posted, including drafts."
      />
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Posting flow lands in Phase 4.
      </div>
    </>
  );
}
