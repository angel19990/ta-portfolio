import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function IndustryTalentPage() {
  await requireRole("industry_user");

  return (
    <>
      <PageHeader
        title="Talent"
        description="Approved actors discoverable through the network."
      />
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Talent grid lands in Phase 2.
      </div>
    </>
  );
}
