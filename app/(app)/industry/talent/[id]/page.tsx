import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { ResumeViewButton } from "@/components/industry/ResumeViewButton";

type Params = Promise<{ id: string }>;

export default async function ActorDetailPage({ params }: { params: Params }) {
  await requireRole("industry_user");
  const { id } = await params;

  const supabase = await createClient();
  // RLS enforces approved+public for industry users.
  const { data: actor } = await supabase
    .from("actor_profiles")
    .select(
      "id, age, location, birthplace, bio, skills, headshot_url, reel_url, resume_url, profiles!inner(full_name, email)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!actor) notFound();

  type ActorWithProfile = typeof actor & {
    profiles: { full_name: string | null; email: string };
  };
  const a = actor as ActorWithProfile;

  const { data: photos } = await supabase
    .from("actor_photos")
    .select("id, url")
    .eq("actor_profile_id", a.id)
    .order("created_at", { ascending: true });

  return (
    <>
      <Link
        href="/industry/talent"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to talent
      </Link>
      <PageHeader
        title={a.profiles?.full_name ?? "Unnamed"}
        description={[a.age != null ? `${a.age} yrs` : null, a.location]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-lg border bg-muted">
            {a.headshot_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.headshot_url}
                alt={a.profiles?.full_name ?? "Actor"}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No headshot
              </div>
            )}
          </div>
          {a.resume_url ? <ResumeViewButton actorProfileId={a.id} /> : null}
          {a.reel_url ? (
            <a
              href={a.reel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              View reel ↗
            </a>
          ) : null}
        </div>

        <div className="space-y-6">
          {a.bio ? (
            <section>
              <h2 className="text-sm font-medium">Bio</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {a.bio}
              </p>
            </section>
          ) : null}

          {a.birthplace ? (
            <section>
              <h2 className="text-sm font-medium">Birthplace</h2>
              <p className="mt-1 text-sm text-muted-foreground">{a.birthplace}</p>
            </section>
          ) : null}

          {a.skills && a.skills.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium">Skills</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.skills.map((s: string) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {photos && photos.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium">Gallery</h2>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <li
                    key={p.id}
                    className="aspect-square overflow-hidden rounded-md border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt="Gallery photo"
                      className="size-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
