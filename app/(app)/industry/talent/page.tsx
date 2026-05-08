import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActorCard } from "@/components/industry/ActorCard";
import { SearchBar } from "@/components/industry/SearchBar";

type SearchParams = Promise<{ q?: string }>;

export default async function IndustryTalentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("industry_user");
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();
  // RLS: industry_user only sees rows where visibility='public' AND approved_at IS NOT NULL
  // (actor_profiles_select_industry_public policy in 0002).
  const { data: rows } = await supabase
    .from("actor_profiles")
    .select(
      "id, headshot_url, age, location, bio, skills, profiles!inner(full_name)",
    )
    .order("created_at", { ascending: false });

  type Row = NonNullable<typeof rows>[number] & {
    profiles: { full_name: string | null };
  };
  const all = (rows ?? []) as Row[];

  // In-memory filter is fine at MVP scale (small studio = O(100) actors).
  // Switch to server-side text search if this slows down.
  const lc = query.toLowerCase();
  const filtered = query
    ? all.filter((r) =>
        [
          r.profiles?.full_name,
          r.bio,
          r.location,
          ...(r.skills ?? []),
        ].some((v) => v && v.toLowerCase().includes(lc)),
      )
    : all;

  return (
    <>
      <PageHeader
        title="Talent"
        description="Approved actors from Truthful Acting Studios."
      />
      <div className="space-y-6">
        <SearchBar defaultValue={query} />
        {filtered.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            {query
              ? `No actors match "${query}". Try a different search.`
              : "No approved actors yet."}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((row) => (
              <li key={row.id}>
                <ActorCard
                  id={row.id}
                  fullName={row.profiles?.full_name ?? null}
                  age={row.age}
                  location={row.location}
                  headshotUrl={row.headshot_url}
                  skills={row.skills ?? []}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
