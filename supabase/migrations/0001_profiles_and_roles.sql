-- =============================================================
-- 0001 — profiles, roles, helpers, RLS skeleton
-- =============================================================

create extension if not exists "pgcrypto";

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles: extends auth.users
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        text not null check (role in ('student','industry_user','admin')),
  full_name   text,
  is_active   boolean not null default true,
  invited_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_role_idx       on public.profiles (role);
create index profiles_is_active_idx  on public.profiles (is_active);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Resolve current user's role for RLS policies (security definer to avoid recursion)
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_role() from public;
grant execute on function public.current_role() to authenticated;

-- Enable RLS
alter table public.profiles enable row level security;

-- SELECT: own row, admins see all, industry users see active students
create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy profiles_select_admin
on public.profiles for select
to authenticated
using (public.current_role() = 'admin');

create policy profiles_select_industry_sees_students
on public.profiles for select
to authenticated
using (
  public.current_role() = 'industry_user'
  and role = 'student'
  and is_active = true
);

-- UPDATE: users update their own non-privileged fields; admins update anyone
-- (Privileged columns role/is_active are protected by a trigger below.)
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_update_admin
on public.profiles for update
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- Prevent non-admins from changing role / is_active on own row
create or replace function public.protect_profile_privileged_columns()
returns trigger language plpgsql as $$
begin
  if public.current_role() = 'admin' then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role can only be changed by an admin';
  end if;
  if new.is_active is distinct from old.is_active then
    raise exception 'is_active can only be changed by an admin';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged
before update on public.profiles
for each row execute function public.protect_profile_privileged_columns();

-- INSERT: only the service role inserts profiles (admin invite path);
-- no policy is created for authenticated users, which means inserts are denied.
-- (Service role bypasses RLS.)
