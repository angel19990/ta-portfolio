-- =============================================================
-- 0005 — let applicants see calls they've applied to (any status)
-- =============================================================
--
-- Without this, /student/applications can't render the call title or
-- metadata for `closed` / `archived` calls — `casting_calls_select_open`
-- only covers status='open', so embedded `casting_calls(...)` in an
-- application query returns null after the call closes.

create policy casting_calls_select_applicant
on public.casting_calls for select
to authenticated
using (
  exists (
    select 1
    from public.casting_applications ca
    join public.actor_profiles ap on ap.id = ca.actor_profile_id
    where ca.casting_call_id = casting_calls.id
      and ap.profile_id = auth.uid()
  )
);
