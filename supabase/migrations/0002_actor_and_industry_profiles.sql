-- =============================================================
-- 0002 — actor_profiles, actor_photos, industry_profiles, storage
-- =============================================================

-- actor_profiles (1:1 with profiles where role='student')
create table public.actor_profiles (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null unique references public.profiles(id) on delete cascade,
  headshot_url text,
  reel_url    text,
  age         int check (age is null or (age >= 0 and age <= 120)),
  location    text,
  birthplace  text,
  bio         text,
  skills      text[] not null default '{}',
  resume_url  text,
  visibility  text not null default 'private' check (visibility in ('private','public')),
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index actor_profiles_visibility_idx
  on public.actor_profiles (visibility, approved_at);
create index actor_profiles_skills_gin
  on public.actor_profiles using gin (skills);

create trigger actor_profiles_set_updated_at
before update on public.actor_profiles
for each row execute function public.set_updated_at();

alter table public.actor_profiles enable row level security;

create policy actor_profiles_select_own
on public.actor_profiles for select
to authenticated
using (profile_id = auth.uid());

create policy actor_profiles_select_admin
on public.actor_profiles for select
to authenticated
using (public.current_role() = 'admin');

create policy actor_profiles_select_industry_public
on public.actor_profiles for select
to authenticated
using (
  public.current_role() = 'industry_user'
  and visibility = 'public'
  and approved_at is not null
);

create policy actor_profiles_insert_own
on public.actor_profiles for insert
to authenticated
with check (profile_id = auth.uid() and public.current_role() = 'student');

create policy actor_profiles_update_own
on public.actor_profiles for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy actor_profiles_update_admin
on public.actor_profiles for update
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- Prevent students from setting their own approved_at
create or replace function public.protect_actor_profile_approval()
returns trigger language plpgsql as $$
begin
  if public.current_role() = 'admin' then
    return new;
  end if;
  if new.approved_at is distinct from old.approved_at then
    raise exception 'approved_at can only be set by an admin';
  end if;
  return new;
end;
$$;

create trigger actor_profiles_protect_approval
before update on public.actor_profiles
for each row execute function public.protect_actor_profile_approval();

-- actor_photos (gallery, max 6 enforced in app + trigger)
create table public.actor_photos (
  id               uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.actor_profiles(id) on delete cascade,
  url              text not null,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

create index actor_photos_profile_idx
  on public.actor_photos (actor_profile_id, sort_order);

create or replace function public.enforce_actor_photos_limit()
returns trigger language plpgsql as $$
declare
  cnt int;
begin
  select count(*) into cnt
    from public.actor_photos
    where actor_profile_id = new.actor_profile_id;
  if cnt >= 6 then
    raise exception 'actor_photos limit (6) reached for this profile';
  end if;
  return new;
end;
$$;

create trigger actor_photos_limit_check
before insert on public.actor_photos
for each row execute function public.enforce_actor_photos_limit();

alter table public.actor_photos enable row level security;

-- Photos visible wherever the parent actor_profile is visible.
create policy actor_photos_select
on public.actor_photos for select
to authenticated
using (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = actor_photos.actor_profile_id
      and (
        ap.profile_id = auth.uid()
        or public.current_role() = 'admin'
        or (public.current_role() = 'industry_user'
            and ap.visibility = 'public'
            and ap.approved_at is not null)
      )
  )
);

create policy actor_photos_insert_own
on public.actor_photos for insert
to authenticated
with check (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = actor_photos.actor_profile_id
      and ap.profile_id = auth.uid()
  )
);

create policy actor_photos_delete_own
on public.actor_photos for delete
to authenticated
using (
  exists (
    select 1 from public.actor_profiles ap
    where ap.id = actor_photos.actor_profile_id
      and ap.profile_id = auth.uid()
  )
);

create policy actor_photos_admin_all
on public.actor_photos for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- industry_profiles (1:1 with profiles where role='industry_user')
create table public.industry_profiles (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null unique references public.profiles(id) on delete cascade,
  company_name text,
  title        text,
  verified     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger industry_profiles_set_updated_at
before update on public.industry_profiles
for each row execute function public.set_updated_at();

alter table public.industry_profiles enable row level security;

create policy industry_profiles_select_own
on public.industry_profiles for select
to authenticated
using (profile_id = auth.uid());

create policy industry_profiles_select_admin
on public.industry_profiles for select
to authenticated
using (public.current_role() = 'admin');

create policy industry_profiles_insert_own
on public.industry_profiles for insert
to authenticated
with check (profile_id = auth.uid() and public.current_role() = 'industry_user');

create policy industry_profiles_update_own
on public.industry_profiles for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy industry_profiles_update_admin
on public.industry_profiles for update
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- Storage buckets ----------------------------------------------
-- Run via supabase CLI (`supabase db push` will apply this section too).
insert into storage.buckets (id, name, public)
values ('headshots', 'headshots', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage policies: owner-write under their own uid folder
create policy "headshots_owner_write"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'headshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "headshots_owner_update"
on storage.objects for update to authenticated
using (bucket_id = 'headshots' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'headshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "headshots_owner_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'headshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_owner_all"
on storage.objects for all to authenticated
using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_owner_all"
on storage.objects for all to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Headshots and photos buckets are public-read; resumes need signed URLs.
