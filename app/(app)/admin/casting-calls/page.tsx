import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminCastingCallsPage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader title="Casting calls" description="All calls across the network." />
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Moderation list lands in Phase 4.
      </div>
    </>
  );
}
