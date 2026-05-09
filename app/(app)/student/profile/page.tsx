import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeadshotUpload } from "@/components/student/HeadshotUpload";
import { PhotoGallery } from "@/components/student/PhotoGallery";
import { ResumeUpload } from "@/components/student/ResumeUpload";
import { TalentProfileForm } from "@/components/student/TalentProfileForm";
import { VisibilityToggle } from "@/components/student/VisibilityToggle";
import {
  emptyActorProfile,
  type TalentProfileInput,
} from "@/lib/validators/actor-profile";

export default async function StudentProfilePage() {
  const user = await requireRole("student");

  const supabase = await createClient();
  // Fire the actor query and a tentative photos query in parallel, gated by
  // a profile_id-based subselect on actor_photos so we don't need the
  // actor_profile_id from the first query before kicking it off.
  const [actorResult, photosResult] = await Promise.all([
    supabase
      .from("actor_profiles")
      .select(
        "id, age, location, birthplace, bio, skills, reel_url, headshot_url, resume_url, visibility, approved_at",
      )
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("actor_photos")
      .select("id, url, actor_profiles!inner(profile_id)")
      .eq("actor_profiles.profile_id", user.id)
      .order("created_at", { ascending: true }),
  ]);
  const actor = actorResult.data;
  const photos = actor
    ? (photosResult.data ?? []).map((row) => ({ id: row.id, url: row.url }))
    : [];

  const initialValues: TalentProfileInput = actor
    ? {
        full_name: user.fullName ?? "",
        age: actor.age,
        location: actor.location ?? "",
        birthplace: actor.birthplace ?? "",
        bio: actor.bio ?? "",
        skills: actor.skills ?? [],
        reel_url: actor.reel_url ?? "",
      }
    : { ...emptyActorProfile(), full_name: user.fullName ?? "" };

  return (
    <>
      <PageHeader
        title="Talent profile"
        description="This is what industry users will see when your profile is approved."
      />
      <div className="space-y-6">
        <VisibilityToggle
          visibility={(actor?.visibility ?? "private") as "public" | "private"}
          approvedAt={actor?.approved_at ?? null}
        />
        <HeadshotUpload currentUrl={actor?.headshot_url ?? null} />
        <PhotoGallery photos={photos} />
        <ResumeUpload hasResume={!!actor?.resume_url} />
        <TalentProfileForm initialValues={initialValues} />
      </div>
    </>
  );
}
