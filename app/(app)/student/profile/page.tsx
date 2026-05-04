import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function StudentProfilePage() {
  const user = await requireRole("student");

  return (
    <>
      <PageHeader
        title="Talent profile"
        description="This is what industry users will see when your profile is approved."
      />
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Signed in as {user.email}. Profile editor lands in the next phase.
      </div>
    </>
  );
}
