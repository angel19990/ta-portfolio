-- =============================================================
-- 0008 — restrict actor-driven application updates to withdraw-only
-- =============================================================
--
-- The original casting_applications_update_actor policy from 0004 only
-- enforced ownership in WITH CHECK — it didn't constrain the new status.
-- A logged-in actor could PATCH their own application to status='shortlisted'
-- via direct PostgREST calls. The server action sends 'withdrawn' but RLS,
-- not the action, is the access boundary.
--
-- Replace with a withdraw-only policy and a row-level trigger that prevents
-- transitions out of terminal states (withdrawn, rejected) for non-admins.

drop policy if exists casting_applications_update_actor
  on public.casting_applications;

create policy casting_applications_withdraw_actor
on public.casting_applications for update
to authenticated
using (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = casting_applications.actor_profile_id
      and ap.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = casting_applications.actor_profile_id
      and ap.profile_id = auth.uid()
  )
  and status = 'withdrawn'
);

create or replace function public.protect_application_terminal_states()
returns trigger language plpgsql as $$
begin
  if public.current_role() = 'admin' then
    return new;
  end if;
  if old.status in ('withdrawn','rejected')
     and new.status is distinct from old.status then
    raise exception 'application status is final';
  end if;
  return new;
end;
$$;

drop trigger if exists casting_applications_protect_terminal
  on public.casting_applications;

create trigger casting_applications_protect_terminal
before update on public.casting_applications
for each row execute function public.protect_application_terminal_states();
