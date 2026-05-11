-- =============================================================
-- 0014 — public read access for approved+public actor profiles
-- =============================================================
-- The talent directory is now a public page (anyone can browse
-- approved+public actors without signing in). Add three SELECT
-- policies for the `anon` role so the existing query shape —
-- actor_profiles + profiles!inner embed + actor_photos — works
-- without auth.
--
-- The `profiles` policy is narrow: anon can only see profile rows
-- that are referenced by an approved+public actor_profiles row.
-- Note RLS is row-level, not column-level; pages MUST avoid
-- selecting `email` from `profiles` on the public pages (defense
-- in depth). If we ever need column-level isolation, swap to a
-- security-definer view.

create policy actor_profiles_select_anon_public
on public.actor_profiles for select
to anon
using (visibility = 'public' and approved_at is not null);

create policy actor_photos_select_anon_public
on public.actor_photos for select
to anon
using (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = actor_photos.actor_profile_id
      and ap.visibility = 'public'
      and ap.approved_at is not null
  )
);

create policy profiles_select_anon_public_actor
on public.profiles for select
to anon
using (
  exists (
    select 1 from public.actor_profiles ap
    where ap.profile_id = profiles.id
      and ap.visibility = 'public'
      and ap.approved_at is not null
  )
);
