import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { PublicHero } from "@/components/landing/PublicHero";
import { TalentListingClient } from "@/components/talent/TalentListingClient";
import { SearchBar } from "@/components/talent/SearchBar";

type SearchParams = Promise<{ q?: string }>;

export default async function TalentDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const user = await getCurrentUser();
  const supabase = await createClient();
  // RLS restricts to approved+public actors for all roles (anon included).
  // See migrations 0002 (authenticated policies) and 0014 (anon policy).
  type Row = {
    id: string;
    headshot_url: string | null;
    location: string | null;
    bio: string | null;
    skills: string[] | null;
    full_name: string | null;
  };

  type RawRow = Omit<Row, "full_name"> & {
    profiles:
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null;
  };

  function normalize(raw: RawRow): Row {
    const p = raw.profiles;
    const name = Array.isArray(p) ? p[0]?.full_name ?? null : p?.full_name ?? null;
    return {
      id: raw.id,
      headshot_url: raw.headshot_url,
      location: raw.location,
      bio: raw.bio,
      skills: raw.skills,
      full_name: name,
    };
  }

  // Deliberately omit `email` from the embed. RLS allows reading it
  // on matched rows, but the public directory should never surface it.
  const baseSelect =
    "id, headshot_url, location, bio, skills, profiles!inner(full_name)";

  // Empty query: list everything RLS allows.
  // Search: push three predicate sets to Postgres in parallel and
  // dedupe client-side by row id.
  //   1. bio / location ilike
  //   2. skills array contains the query (uses GIN index)
  //   3. profiles.full_name ilike (joined inner)
  let filtered: Row[];
  if (!query) {
    const { data } = await supabase
      .from("actor_profiles")
      .select(baseSelect)
      .order("created_at", { ascending: false })
      .limit(100);
    filtered = ((data ?? []) as unknown as RawRow[]).map(normalize);
  } else {
    const escaped = query.replace(/[%_]/g, (m) => `\\${m}`);
    const ilikePattern = `%${escaped}%`;
    const [bioRes, skillRes, nameRes] = await Promise.all([
      supabase
        .from("actor_profiles")
        .select(baseSelect)
        .or(`bio.ilike.${ilikePattern},location.ilike.${ilikePattern}`)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("actor_profiles")
        .select(baseSelect)
        .contains("skills", [query])
        .limit(50),
      supabase
        .from("actor_profiles")
        .select(baseSelect)
        .ilike("profiles.full_name", ilikePattern)
        .limit(50),
    ]);

    const seen = new Set<string>();
    filtered = [];
    for (const res of [bioRes.data, skillRes.data, nameRes.data]) {
      for (const raw of (res ?? []) as unknown as RawRow[]) {
        if (!seen.has(raw.id)) {
          seen.add(raw.id);
          filtered.push(normalize(raw));
        }
      }
    }
  }

  return (
    <>
      {user ? null : <PublicHero />}
      <PageHeader
        title="Meet Our Talent"
        description="Approved actors from Truthful Acting Studios."
      />
      <div className="space-y-6">
        <SearchBar defaultValue={query} />
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {query
              ? `No actors match "${query}". Try a different search.`
              : "No approved talent yet"}
          </div>
        ) : (
          <TalentListingClient actors={filtered} />
        )}
      </div>
    </>
  );
}
