-- =============================================================
-- 0007 — let call owners see applicants' actor_profiles
-- =============================================================
--
-- Industry users can only read actor_profiles where
-- visibility='public' AND approved_at IS NOT NULL (the talent grid policy).
-- That blocks the applicants table on /industry/casting-calls/[id] from
-- rendering names for unapproved-yet students who applied. Open up just
-- enough access: a call owner can see actor_profile rows for actors who
-- applied to their call.
--
-- Same SECURITY DEFINER pattern as 0006 — wraps the cross-table lookup
-- to avoid RLS recursion (casting_applications_select_call_owner reads
-- casting_calls, which would loop back through any policy that joined
-- through casting_applications inline).

create or replace function public.user_owns_call_with_applicant(actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.casting_applications ca
    join public.casting_calls c on c.id = ca.casting_call_id
    where ca.actor_profile_id = actor_id
      and c.created_by = auth.uid()
  )
$$;

grant execute on function public.user_owns_call_with_applicant(uuid)
  to authenticated;

create policy actor_profiles_select_call_owner
on public.actor_profiles for select
to authenticated
using (public.user_owns_call_with_applicant(actor_profiles.id));
