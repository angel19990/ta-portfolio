-- =============================================================
-- 0016 — authenticated students can read approved+public actors
-- =============================================================
-- The talent directory is intended to be visible to ALL roles
-- (anon and authenticated). Migration 0014 added the `anon`
-- policies; this migration adds the matching coverage for
-- authenticated students. Industry users and admins were already
-- covered in 0002.

create policy actor_profiles_select_student_public
on public.actor_profiles for select
to authenticated
using (
  public.current_role() = 'student'
  and visibility = 'public'
  and approved_at is not null
);

create policy actor_photos_select_student_public
on public.actor_photos for select
to authenticated
using (
  public.current_role() = 'student'
  and exists (
    select 1 from public.actor_profiles ap
    where ap.id = actor_photos.actor_profile_id
      and ap.visibility = 'public'
      and ap.approved_at is not null
  )
);

create policy profiles_select_student_sees_public_actor
on public.profiles for select
to authenticated
using (
  public.current_role() = 'student'
  and exists (
    select 1 from public.actor_profiles ap
    where ap.profile_id = profiles.id
      and ap.visibility = 'public'
      and ap.approved_at is not null
  )
);
