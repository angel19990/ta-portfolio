-- =============================================================
-- 0012 — actor_profiles: rename birthplace → ethnicity
-- =============================================================
-- No policy, trigger, or index references the column (verified against
-- supabase/migrations/0002_actor_and_industry_profiles.sql and 0007/0009).

alter table public.actor_profiles
  rename column birthplace to ethnicity;
