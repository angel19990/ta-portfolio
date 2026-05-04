-- =============================================================
-- 0003 — classes, class_sections, student_classes, student_notes
-- =============================================================

-- classes (catalog)
create table public.classes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  code                text,
  description         text,
  level               text,
  default_price_cents int not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

alter table public.classes enable row level security;

-- All authed users can read the catalog (students see what they could enroll in)
create policy classes_select_authed
on public.classes for select
to authenticated
using (true);

create policy classes_admin_all
on public.classes for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- class_sections (specific offerings, e.g., V1PM-FA25-M)
create table public.class_sections (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id) on delete restrict,
  section_code  text not null unique,
  term          text not null,
  start_date    date,
  end_date      date,
  instructor_id uuid references public.profiles(id),
  capacity      int,
  price_cents   int,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index class_sections_class_term_idx on public.class_sections (class_id, term);
create index class_sections_active_idx     on public.class_sections (is_active, start_date);

create trigger class_sections_set_updated_at
before update on public.class_sections
for each row execute function public.set_updated_at();

alter table public.class_sections enable row level security;

create policy class_sections_select_authed
on public.class_sections for select
to authenticated
using (true);

create policy class_sections_admin_all
on public.class_sections for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- student_classes (enrollments — reference a section, not a raw class)
create table public.student_classes (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               uuid not null references public.profiles(id) on delete cascade,
  class_section_id         uuid not null references public.class_sections(id) on delete restrict,
  status                   text not null default 'enrolled'
                            check (status in ('enrolled','completed','dropped')),
  enrolled_at              timestamptz not null default now(),
  completed_at             timestamptz,
  payment_status           text not null default 'unpaid'
                            check (payment_status in ('unpaid','partial','paid','refunded')),
  amount_paid_cents        int not null default 0,
  outstanding_cents        int not null default 0,
  referral_discount_cents  int not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (profile_id, class_section_id)
);

create index student_classes_profile_status_idx
  on public.student_classes (profile_id, status);
create index student_classes_section_payment_idx
  on public.student_classes (class_section_id, payment_status);

create trigger student_classes_set_updated_at
before update on public.student_classes
for each row execute function public.set_updated_at();

alter table public.student_classes enable row level security;

-- Students can read their own enrollments
create policy student_classes_select_own
on public.student_classes for select
to authenticated
using (profile_id = auth.uid());

create policy student_classes_admin_all
on public.student_classes for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- student_notes (admin-only freeform notes about a student)
create table public.student_notes (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index student_notes_profile_created_idx
  on public.student_notes (profile_id, created_at desc);

alter table public.student_notes enable row level security;

create policy student_notes_admin_all
on public.student_notes for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');
