import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function StudentCastingCallsPage() {
  await requireRole("student");

  return (
    <>
      <PageHeader title="Casting calls" description="Open calls you can apply to." />
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Casting call list lands in Phase 2.
      </div>
    </>
  );
}
