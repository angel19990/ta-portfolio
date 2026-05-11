-- Drop age (no longer collected or surfaced anywhere).
-- Add three optional plain-text fields surfaced on the public talent profile:
--   current_job        — actor's non-acting day job
--   favorite_movies    — comma-separated free text
--   favorite_series    — comma-separated free text

alter table public.actor_profiles
  drop column if exists age,
  add column if not exists current_job text,
  add column if not exists favorite_movies text,
  add column if not exists favorite_series text;
