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
  type Row = {
    id: string;
    headshot_url: string | null;
    age: number | null;
    location: string | null;
    bio: string | null;
    skills: string[] | null;
    full_name: string | null;
  };

  // PostgREST returns embedded `profiles` as a 1-element array. Normalize to a
  // flat Row so downstream rendering doesn't need to know about the embed shape.
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
      age: raw.age,
      location: raw.location,
      bio: raw.bio,
      skills: raw.skills,
      full_name: name,
    };
  }

  const baseSelect =
    "id, headshot_url, age, location, bio, skills, profiles!inner(full_name)";

  // For empty queries we list everything RLS allows; for searches we push
  // matching down to Postgres and union three predicate sets:
  //   1. bio / location ilike
  //   2. skills array contains the query (uses GIN index)
  //   3. profiles.full_name ilike (joined inner)
  // The de-dup happens client-side via Set on row id.
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
      <PageHeader
        title="Talent"
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
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((row) => (
              <li key={row.id}>
                <ActorCard
                  id={row.id}
                  fullName={row.full_name}
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
