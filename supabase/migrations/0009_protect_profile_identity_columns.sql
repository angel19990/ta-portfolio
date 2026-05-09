-- =============================================================
-- 0009 — extend profile column protection to identity fields
-- =============================================================
--
-- The original protect_profile_privileged_columns trigger from 0001 only
-- guarded role and is_active. A user could still PATCH their own profile
-- to change `email`, `invited_by`, or `id` — letting them spoof identity
-- in admin grids and break the unique-email assumption used by inviteUser.
--
-- Reject self-changes to email, invited_by, and id for non-admins.

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
  if new.email is distinct from old.email then
    raise exception 'email can only be changed by an admin';
  end if;
  if new.invited_by is distinct from old.invited_by then
    raise exception 'invited_by can only be changed by an admin';
  end if;
  if new.id is distinct from old.id then
    raise exception 'id is immutable';
  end if;
  return new;
end;
$$;
