import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function StudentApplicationsPage() {
  await requireRole("student");

  return (
    <>
      <PageHeader title="Your applications" />
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Applications list lands with the apply flow.
      </div>
    </>
  );
}
