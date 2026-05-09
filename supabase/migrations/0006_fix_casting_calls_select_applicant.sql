-- =============================================================
-- 0006 — fix infinite recursion in casting_calls_select_applicant
-- =============================================================
--
-- The 0005 policy queried public.casting_applications inside its USING
-- clause, but casting_applications has its own RLS policies that join back
-- to casting_calls (e.g. casting_applications_select_call_owner). That
-- re-triggered casting_calls policies and looped (Postgres 42P17).
--
-- Wrap the existence check in a SECURITY DEFINER function so it bypasses
-- RLS during the lookup — same pattern as public.current_role() in 0001.

drop policy if exists casting_calls_select_applicant on public.casting_calls;

create or replace function public.user_has_application_for_call(call_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.casting_applications ca
    join public.actor_profiles ap on ap.id = ca.actor_profile_id
    where ca.casting_call_id = call_id
      and ap.profile_id = auth.uid()
  )
$$;

grant execute on function public.user_has_application_for_call(uuid)
  to authenticated;

create policy casting_calls_select_applicant
on public.casting_calls for select
to authenticated
using (
  public.user_has_application_for_call(casting_calls.id)
);
