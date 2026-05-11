-- =============================================================
-- 0011 — casting_calls.attachment_url + bucket + dropdown normalization
-- =============================================================

-- Column
alter table public.casting_calls
  add column if not exists attachment_url text;

-- Normalize any free-text values that drifted from the new enum options so
-- the form's Zod schema (z.enum([...])) doesn't reject existing rows on edit.
update public.casting_calls
   set project_type = case
     when project_type ilike 'feature%'                              then 'Feature'
     when project_type ilike 'tv%' or project_type ilike 'television%' then 'TV'
     when project_type ilike 'commercial%'                           then 'Commercial'
     when project_type ilike 'theater%' or project_type ilike 'theatre%' then 'Theater'
     when project_type ilike 'short%'                                then 'Short'
     when project_type is null or project_type = ''                   then null
     when project_type not in ('Feature','TV','Commercial','Theater','Short','Other') then 'Other'
     else project_type
   end
 where project_type is not null;

update public.casting_calls
   set union_status = case
     when union_status ilike 'union%'        then 'Union'
     when union_status ilike 'non-union%' or union_status ilike 'nonunion%' then 'Non-Union'
     when union_status ilike 'either%'       then 'Either'
     when union_status is null or union_status = '' then null
     else union_status
   end
 where union_status is not null;

update public.casting_calls
   set pay_status = case
     when pay_status ilike 'paid%'      then 'Paid'
     when pay_status ilike 'unpaid%'    then 'Unpaid'
     when pay_status ilike 'stipend%'   then 'Stipend'
     when pay_status ilike 'deferred%'  then 'Deferred'
     when pay_status is null or pay_status = '' then null
     else pay_status
   end
 where pay_status is not null;

-- Storage bucket — private; signed URLs only.
insert into storage.buckets (id, name, public)
values ('casting-call-attachments', 'casting-call-attachments', false)
on conflict (id) do nothing;

-- Owner-write under their own uid folder; mirrors resumes_owner_all.
create policy "casting_call_attachments_owner_all"
on storage.objects for all to authenticated
using (
  bucket_id = 'casting-call-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'casting-call-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read/manage any attachment.
create policy "casting_call_attachments_admin_all"
on storage.objects for all to authenticated
using (
  bucket_id = 'casting-call-attachments'
  and public.current_role() = 'admin'
)
with check (
  bucket_id = 'casting-call-attachments'
  and public.current_role() = 'admin'
);
