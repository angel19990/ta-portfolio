-- =============================================================
-- 0013 — actor_profiles: drop reel_url
-- =============================================================
-- No policy, trigger, or index references the column.

alter table public.actor_profiles
  drop column if exists reel_url;
