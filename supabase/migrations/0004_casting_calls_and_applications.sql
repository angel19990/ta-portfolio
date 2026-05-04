-- =============================================================
-- 0004 — casting_calls, casting_applications
-- =============================================================

create table public.casting_calls (
  id                  uuid primary key default gen_random_uuid(),
  created_by          uuid not null references public.profiles(id) on delete restrict,
  title               text not null,
  production_company  text,
  project_type        text,   -- Feature, TV, Commercial, Theater, Short, Other
  union_status        text,   -- Union, Non-Union, Either
  pay_status          text,   -- Paid, Unpaid, Stipend, Deferred
  shoot_start         date,
  shoot_end           date,
  deadline            timestamptz,
  location            text,
  description         text,
  status              text not null default 'open'
                        check (status in ('draft','open','closed','archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index casting_calls_status_deadline_idx on public.casting_calls (status, deadline);
create index casting_calls_created_by_idx      on public.casting_calls (created_by);

create trigger casting_calls_set_updated_at
before update on public.casting_calls
for each row execute function public.set_updated_at();

alter table public.casting_calls enable row level security;

-- Anyone authenticated can browse open calls
create policy casting_calls_select_open
on public.casting_calls for select
to authenticated
using (status = 'open');

-- Owner sees their own (any status)
create policy casting_calls_select_own
on public.casting_calls for select
to authenticated
using (created_by = auth.uid());

create policy casting_calls_select_admin
on public.casting_calls for select
to authenticated
using (public.current_role() = 'admin');

-- Industry users + admins can post; created_by must match the inserter
create policy casting_calls_insert
on public.casting_calls for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_role() in ('industry_user','admin')
);

create policy casting_calls_update_owner
on public.casting_calls for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy casting_calls_update_admin
on public.casting_calls for update
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy casting_calls_delete_owner_or_admin
on public.casting_calls for delete
to authenticated
using (created_by = auth.uid() or public.current_role() = 'admin');

-- casting_applications
create table public.casting_applications (
  id               uuid primary key default gen_random_uuid(),
  casting_call_id  uuid not null references public.casting_calls(id) on delete cascade,
  actor_profile_id uuid not null references public.actor_profiles(id) on delete cascade,
  status           text not null default 'submitted'
                    check (status in ('submitted','shortlisted','rejected','withdrawn')),
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (casting_call_id, actor_profile_id)
);

create index casting_applications_call_status_idx
  on public.casting_applications (casting_call_id, status);
create index casting_applications_actor_idx
  on public.casting_applications (actor_profile_id);

create trigger casting_applications_set_updated_at
before update on public.casting_applications
for each row execute function public.set_updated_at();

alter table public.casting_applications enable row level security;

-- Actor sees own applications
create policy casting_applications_select_actor
on public.casting_applications for select
to authenticated
using (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = casting_applications.actor_profile_id
      and ap.profile_id = auth.uid()
  )
);

-- Industry user sees applications to their calls
create policy casting_applications_select_call_owner
on public.casting_applications for select
to authenticated
using (
  exists (
    select 1 from public.casting_calls c
    where c.id = casting_applications.casting_call_id
      and c.created_by = auth.uid()
  )
);

create policy casting_applications_select_admin
on public.casting_applications for select
to authenticated
using (public.current_role() = 'admin');

-- Student applies (must own the actor_profile, must be an open call)
create policy casting_applications_insert_student
on public.casting_applications for insert
to authenticated
with check (
  public.current_role() = 'student'
  and exists (
    select 1 from public.actor_profiles ap
    where ap.id = casting_applications.actor_profile_id
      and ap.profile_id = auth.uid()
  )
  and exists (
    select 1 from public.casting_calls c
    where c.id = casting_applications.casting_call_id
      and c.status = 'open'
  )
);

-- Industry user updates status on their own call (shortlist/reject)
create policy casting_applications_update_call_owner
on public.casting_applications for update
to authenticated
using (
  exists (
    select 1 from public.casting_calls c
    where c.id = casting_applications.casting_call_id
      and c.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.casting_calls c
    where c.id = casting_applications.casting_call_id
      and c.created_by = auth.uid()
  )
);

-- Actor can withdraw (update their own to status='withdrawn')
create policy casting_applications_update_actor
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
);

create policy casting_applications_admin_all
on public.casting_applications for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');
