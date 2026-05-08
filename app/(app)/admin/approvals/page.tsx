import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { PendingApprovalRow } from "@/components/admin/PendingApprovalRow";

export default async function AdminApprovalsPage() {
  await requireRole("admin");

  const supabase = await createClient();

  // Pending = profile is set to public but admin hasn't approved yet.
  const { data: rows } = await supabase
    .from("actor_profiles")
    .select(
      "id, headshot_url, bio, location, profiles!inner(full_name, email)",
    )
    .eq("visibility", "public")
    .is("approved_at", null)
    .order("created_at", { ascending: true });

  type Row = NonNullable<typeof rows>[number] & {
    profiles: { full_name: string | null; email: string };
  };
  const pending = (rows ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Pending approvals"
        description="Public profiles waiting on admin approval before they appear to industry users."
      />
      {pending.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Nothing pending. All public profiles are approved.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((row) => (
            <PendingApprovalRow
              key={row.id}
              id={row.id}
              fullName={row.profiles.full_name}
              email={row.profiles.email}
              headshotUrl={row.headshot_url}
              bio={row.bio}
              location={row.location}
            />
          ))}
        </ul>
      )}
    </>
  );
}
