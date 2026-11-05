-- =====================================================================
-- GlobalPath student portal – schema, access control and workflows.
--
-- Everything sensitive is enforced here, not only in the web app:
--   * Row Level Security on every table.
--   * Column-level grants so students cannot change statuses, references
--     or roles even with a hand-crafted API request.
--   * Workflow changes (submit, review, role changes) go through
--     SECURITY DEFINER functions that check permissions explicitly and
--     write history, notifications and audit entries in one transaction.
--   * Staff powers require an MFA (aal2) session unless
--     portal_config.require_staff_mfa is switched off.
--   * Documents live in a private bucket with no client-facing storage
--     policies; files are only reachable through short-lived signed URLs
--     created by the server after an authorisation check.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.staff_role as enum ('reviewer', 'admin');

create type public.document_status as enum (
  'uploaded', 'security_check', 'pending_review', 'under_review',
  'verified', 'correction_required', 'rejected'
);

create type public.application_status as enum (
  'draft', 'submitted', 'under_review', 'missing_documents',
  'correction_required', 'documents_verified', 'review_completed',
  'closed', 'withdrawn'
);

create type public.degree_level as enum ('foundation', 'bachelor', 'master', 'phd', 'language_course', 'other');
create type public.qualification_level as enum ('secondary', 'diploma', 'bachelor', 'master', 'doctorate', 'other');
create type public.scan_status as enum ('pending', 'clean', 'not_scanned', 'infected', 'failed');
create type public.consultation_status as enum ('requested', 'contacted', 'confirmed', 'completed', 'cancelled');

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Single-row configuration. Change with SQL only (no client write access).
create table public.portal_config (
  id int primary key default 1 check (id = 1),
  require_staff_mfa boolean not null default true
);
insert into public.portal_config (id) values (1);

-- ---------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------
create sequence public.applicant_ref_seq;

create function public.next_applicant_ref() returns text
language sql volatile set search_path = '' as $$
  select 'GP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.applicant_ref_seq')::text, 5, '0')
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  applicant_ref text not null unique default public.next_applicant_ref(),
  email text not null,
  first_name text not null default '' check (char_length(first_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  date_of_birth date check (date_of_birth is null or date_of_birth between '1900-01-01' and current_date),
  nationality text check (char_length(nationality) <= 100),
  country_of_residence text check (char_length(country_of_residence) <= 100),
  phone text check (char_length(phone) <= 30),
  preferred_destination text check (char_length(preferred_destination) <= 100),
  terms_accepted_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.staff_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role public.staff_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now()
);

create table public.reviewer_assignments (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.staff_roles (user_id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (reviewer_id, student_id)
);
create index reviewer_assignments_student_idx on public.reviewer_assignments (student_id);

-- Role of the caller, or null. Staff roles only count in an MFA session
-- (aal2) unless MFA enforcement is switched off in portal_config.
create function public.current_staff_role() returns public.staff_role
language sql stable security definer set search_path = '' as $$
  select sr.role
  from public.staff_roles sr
  where sr.user_id = auth.uid()
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not (select c.require_staff_mfa from public.portal_config c where c.id = 1)
    )
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_staff_role() = 'admin', false)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.current_staff_role() is not null
$$;

-- Admins see every student; reviewers only students assigned to them.
create function public.staff_can_access(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case public.current_staff_role()
    when 'admin' then true
    when 'reviewer' then exists (
      select 1 from public.reviewer_assignments ra
      where ra.reviewer_id = auth.uid() and ra.student_id = p_student and ra.active
    )
    else false
  end
$$;

-- ---------------------------------------------------------------------
-- Notifications and audit log (written only by trusted functions)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  values (p_user, p_kind, p_title, p_body, p_link)
$$;

create function public.audit(p_action text, p_entity text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
$$;

-- ---------------------------------------------------------------------
-- New auth users get a profile + welcome notification
-- ---------------------------------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, first_name, last_name, terms_accepted_at)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 100),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 100),
    case when new.raw_user_meta_data ->> 'accepted_terms' = 'true' then now() end
  );
  perform public.notify(new.id, 'account', 'Registration completed',
    'Your GlobalPath portal account was created. Verify your email address to activate it.', '/portal');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    perform public.notify(new.id, 'account', 'Email verified',
      'Your email address is verified and your account is active.', '/portal');
  end if;
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_updated after update on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------
-- Academic and language qualifications
-- ---------------------------------------------------------------------
create table public.academic_qualifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  level public.qualification_level not null,
  institution text not null check (char_length(institution) between 1 and 200),
  country text not null check (char_length(country) between 1 and 100),
  qualification_name text not null check (char_length(qualification_name) between 1 and 200),
  field_of_study text check (char_length(field_of_study) <= 200),
  start_date date,
  end_date date,
  graduation_status text not null check (graduation_status in ('completed', 'in_progress', 'expected', 'incomplete')),
  grade text check (char_length(grade) <= 50),
  grading_system text check (char_length(grading_system) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index academic_qualifications_student_idx on public.academic_qualifications (student_id);
create trigger academic_qualifications_updated_at before update on public.academic_qualifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- University / course catalogue (admin-published, verified sources only)
-- ---------------------------------------------------------------------
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  country text not null check (char_length(country) between 2 and 100),
  city text check (char_length(city) <= 100),
  website_url text check (website_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  verified_on date not null,
  notes text check (char_length(notes) <= 2000),
  published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger universities_updated_at before update on public.universities
  for each row execute function public.set_updated_at();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  degree_level public.degree_level not null,
  field_of_study text check (char_length(field_of_study) <= 200),
  language_of_instruction text check (char_length(language_of_instruction) <= 100),
  duration text check (char_length(duration) <= 100),
  intake text check (char_length(intake) <= 200),
  application_route text check (char_length(application_route) <= 200),
  requirements_summary text check (char_length(requirements_summary) <= 4000),
  source_url text not null check (source_url ~ '^https://'),
  verified_on date not null,
  published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_university_idx on public.courses (university_id);
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.shortlist_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  university_id uuid references public.universities (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((university_id is null) <> (course_id is null)),
  unique (student_id, university_id),
  unique (student_id, course_id)
);

-- ---------------------------------------------------------------------
-- Applications (GlobalPath internal preparation & review – NOT a
-- university or uni-assist submission)
-- ---------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reference text not null unique default ('APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  course_id uuid references public.courses (id) on delete set null,
  programme_snapshot text not null default '',
  degree_level public.degree_level,
  intake text check (char_length(intake) <= 100),
  student_notes text check (char_length(student_notes) <= 4000),
  status public.application_status not null default 'draft',
  staff_feedback text check (char_length(staff_feedback) <= 4000),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_student_idx on public.applications (student_id);
create index applications_status_idx on public.applications (status);
create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- Students may only pick published courses; keep a readable snapshot of
-- the programme in case the listing is later edited or removed.
create function public.applications_course_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_label text;
  v_level public.degree_level;
  v_published boolean;
begin
  if new.course_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.course_id is not distinct from old.course_id then
    return new;
  end if;
  select c.name || ' – ' || u.name || ' (' || u.country || ')', c.degree_level, c.published and u.published
    into v_label, v_level, v_published
  from public.courses c join public.universities u on u.id = c.university_id
  where c.id = new.course_id;
  if not found or (not v_published and not public.is_staff()) then
    raise exception 'Choose a published programme' using errcode = '22023';
  end if;
  new.programme_snapshot := v_label;
  new.degree_level := v_level;
  return new;
end $$;

create trigger applications_course_guard before insert or update of course_id on public.applications
  for each row execute function public.applications_course_guard();

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index application_status_history_app_idx on public.application_status_history (application_id, created_at);

-- ---------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------
create table public.document_categories (
  code text primary key,
  label text not null,
  description text,
  reusable boolean not null default true,
  sensitive boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true
);

insert into public.document_categories (code, label, description, reusable, sensitive, sort_order) values
  ('secondary_certificate', 'Secondary school certificate', 'e.g. WAEC/NECO/SSCE, A-Levels or equivalent', true, false, 10),
  ('bachelor_certificate', 'Bachelor''s degree certificate', null, true, false, 20),
  ('master_certificate', 'Master''s degree certificate', null, true, false, 30),
  ('transcript', 'Academic transcript', 'Complete transcript showing all semesters/years', true, false, 40),
  ('language_certificate', 'Language proficiency certificate', 'IELTS, TOEFL, TestDaF, Goethe or similar', true, false, 50),
  ('passport_id', 'Passport or national ID', 'Upload only when your adviser asks for it', true, true, 60),
  ('cv', 'Curriculum Vitae', null, true, false, 70),
  ('motivation_letter', 'Motivation letter', 'Usually specific to one application', false, false, 80),
  ('recommendation_letter', 'Recommendation letter', null, true, false, 90),
  ('certified_translation', 'Certified translation', null, true, false, 100),
  ('other', 'Other supporting document', null, true, false, 110);

create table public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  degree_level public.degree_level not null,
  category text not null references public.document_categories (code),
  required boolean not null default true,
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  unique (degree_level, category)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category text not null references public.document_categories (code),
  title text not null check (char_length(title) between 1 and 150),
  -- null = reusable library document; set = specific to one application
  application_id uuid references public.applications (id) on delete cascade,
  status public.document_status not null default 'uploaded',
  current_version_id uuid,
  latest_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_owner_idx on public.documents (owner_id);
create index documents_status_idx on public.documents (status);
create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version_no int not null,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  sha256 text,
  scan_status public.scan_status not null default 'pending',
  upload_completed boolean not null default false,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_no)
);

alter table public.documents
  add constraint documents_current_version_fk
  foreign key (current_version_id) references public.document_versions (id) on delete set null;

create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version_id uuid references public.document_versions (id) on delete set null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  from_status public.document_status,
  to_status public.document_status not null,
  feedback text check (char_length(feedback) <= 2000),
  created_at timestamptz not null default now()
);
create index document_reviews_document_idx on public.document_reviews (document_id, created_at desc);

create table public.application_documents (
  application_id uuid not null references public.applications (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  attached_at timestamptz not null default now(),
  primary key (application_id, document_id)
);
create index application_documents_document_idx on public.application_documents (document_id);

create table public.language_qualifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  test text not null check (test in ('IELTS', 'TOEFL', 'TestDaF', 'Goethe', 'telc', 'DSH', 'Cambridge', 'Duolingo', 'Other')),
  test_name_other text check (char_length(test_name_other) <= 100),
  language text not null default 'English' check (char_length(language) between 1 and 60),
  result text not null check (char_length(result) between 1 and 60),
  sub_scores text check (char_length(sub_scores) <= 200),
  test_date date,
  certificate_document_id uuid references public.documents (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index language_qualifications_student_idx on public.language_qualifications (student_id);
create trigger language_qualifications_updated_at before update on public.language_qualifications
  for each row execute function public.set_updated_at();

-- A certificate can only point at the student's own document.
create function public.language_certificate_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.certificate_document_id is not null and not exists (
    select 1 from public.documents d where d.id = new.certificate_document_id and d.owner_id = new.student_id
  ) then
    raise exception 'Certificate not found' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger language_certificate_guard before insert or update on public.language_qualifications
  for each row execute function public.language_certificate_guard();

-- ---------------------------------------------------------------------
-- Messages and consultations
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_student_idx on public.messages (student_id, created_at);

create function public.messages_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.sender_id is distinct from new.student_id then
    perform public.notify(new.student_id, 'message', 'New message from GlobalPath',
      'A member of the GlobalPath team sent you a message.', '/portal/notifications');
  end if;
  return new;
end $$;
create trigger messages_notify after insert on public.messages
  for each row execute function public.messages_notify();

-- Consultation requests a signed-in student submitted themselves.
-- Records are never linked to an account by matching email addresses.
create table public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  service text not null check (char_length(service) <= 100),
  destination text check (char_length(destination) <= 100),
  preferred_date date,
  message text check (char_length(message) <= 1500),
  status public.consultation_status not null default 'requested',
  confirmed_for timestamptz,
  staff_note text check (char_length(staff_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index consultation_requests_user_idx on public.consultation_requests (user_id, created_at desc);
create trigger consultation_requests_updated_at before update on public.consultation_requests
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Workflow functions
-- =====================================================================

-- Student: register a new upload (new document or replacement version).
-- Returns the version id and the private storage path the server will
-- sign an upload URL for. Ownership and replace rules are checked here.
create function public.begin_document_upload(
  p_document_id uuid,
  p_category text,
  p_title text,
  p_application_id uuid,
  p_file_name text,
  p_mime_type text,
  p_size_bytes int
) returns table (document_id uuid, version_id uuid, storage_path text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_doc public.documents;
  v_version_id uuid := gen_random_uuid();
  v_version_no int;
  v_ext text;
  v_path text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  v_ext := case p_mime_type
    when 'application/pdf' then 'pdf'
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
  end;
  if v_ext is null then
    raise exception 'Only PDF, JPG, PNG or WebP files are accepted' using errcode = '22023';
  end if;
  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 10485760 then
    raise exception 'Files must be 10 MB or smaller' using errcode = '22023';
  end if;

  if p_document_id is null then
    if not exists (select 1 from public.document_categories c where c.code = p_category and c.active) then
      raise exception 'Choose a document category' using errcode = '22023';
    end if;
    if p_application_id is not null and not exists (
      select 1 from public.applications a
      where a.id = p_application_id and a.student_id = v_uid
        and a.status in ('draft', 'missing_documents', 'correction_required')
    ) then
      raise exception 'This application cannot be changed right now' using errcode = '42501';
    end if;
    insert into public.documents (owner_id, category, title, application_id, status)
    values (v_uid, p_category, left(coalesce(nullif(trim(p_title), ''), p_file_name), 150), p_application_id, 'uploaded')
    returning * into v_doc;
    if p_application_id is not null then
      insert into public.application_documents (application_id, document_id) values (p_application_id, v_doc.id);
    end if;
  else
    select * into v_doc from public.documents d where d.id = p_document_id and d.owner_id = v_uid for update;
    if not found then
      raise exception 'Document not found' using errcode = '42501';
    end if;
    if v_doc.status = 'under_review' then
      raise exception 'This document is being reviewed. Wait for the review to finish before replacing it.' using errcode = '22023';
    end if;
  end if;

  select coalesce(max(v.version_no), 0) + 1 into v_version_no
  from public.document_versions v where v.document_id = v_doc.id;

  v_path := v_uid::text || '/' || v_doc.id::text || '/' || v_version_id::text || '.' || v_ext;

  insert into public.document_versions (id, document_id, version_no, storage_path, file_name, mime_type, size_bytes, uploaded_by)
  values (v_version_id, v_doc.id, v_version_no, v_path, left(p_file_name, 200), p_mime_type, p_size_bytes, v_uid);

  return query select v_doc.id, v_version_id, v_path;
end $$;

-- Server only (service role): record the result of the server-side file
-- checks and make the version current. Not executable by clients.
create function public.finalize_document_version(p_version_id uuid, p_sha256 text, p_scan public.scan_status)
returns public.document_status
language plpgsql security definer set search_path = '' as $$
declare
  v_version public.document_versions;
  v_doc public.documents;
  v_new_status public.document_status;
begin
  select * into v_version from public.document_versions where id = p_version_id for update;
  if not found or v_version.upload_completed then
    raise exception 'Upload not found or already completed';
  end if;
  select * into v_doc from public.documents where id = v_version.document_id for update;

  update public.document_versions
     set sha256 = p_sha256, scan_status = p_scan, upload_completed = p_scan in ('clean', 'not_scanned')
   where id = p_version_id;

  if p_scan in ('infected', 'failed') then
    -- Keep the previous version current; a first upload that fails checks is removed by the caller.
    insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
    values (v_version.uploaded_by, 'document.upload_blocked', 'document', v_doc.id::text, jsonb_build_object('version', v_version.version_no, 'scan', p_scan));
    return v_doc.status;
  end if;

  v_new_status := 'pending_review';
  update public.documents
     set current_version_id = p_version_id, status = v_new_status, latest_feedback = null
   where id = v_doc.id;

  insert into public.document_reviews (document_id, version_id, reviewer_id, from_status, to_status, feedback)
  values (v_doc.id, p_version_id, null, v_doc.status, v_new_status,
          case when v_version.version_no > 1 then 'Replacement uploaded – verification restarted.' end);

  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values (v_version.uploaded_by, case when v_version.version_no > 1 then 'document.replaced' else 'document.uploaded' end,
          'document', v_doc.id::text, jsonb_build_object('version', v_version.version_no, 'scan', p_scan));

  perform public.notify(v_doc.owner_id, 'document', 'Document uploaded',
    '"' || v_doc.title || '" was uploaded and is waiting for GlobalPath review.', '/portal/documents');
  return v_new_status;
end $$;

-- Staff: change a document's verification status.
create function public.staff_review_document(p_document_id uuid, p_status public.document_status, p_feedback text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_doc public.documents;
  v_scan public.scan_status;
  v_feedback text := nullif(trim(p_feedback), '');
begin
  select * into v_doc from public.documents where id = p_document_id for update;
  if not found or not public.staff_can_access(v_doc.owner_id) then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_status not in ('under_review', 'verified', 'correction_required', 'rejected') then
    raise exception 'Unsupported review status' using errcode = '22023';
  end if;
  if v_doc.current_version_id is null then
    raise exception 'There is no completed upload to review' using errcode = '22023';
  end if;
  select scan_status into v_scan from public.document_versions where id = v_doc.current_version_id;
  if v_scan not in ('clean', 'not_scanned') then
    raise exception 'This file has not passed the security check' using errcode = '22023';
  end if;
  if p_status in ('correction_required', 'rejected') and v_feedback is null then
    raise exception 'Add feedback so the student knows what to change' using errcode = '22023';
  end if;
  if char_length(v_feedback) > 2000 then
    raise exception 'Feedback is too long' using errcode = '22023';
  end if;

  update public.documents set status = p_status, latest_feedback = v_feedback where id = v_doc.id;

  insert into public.document_reviews (document_id, version_id, reviewer_id, from_status, to_status, feedback)
  values (v_doc.id, v_doc.current_version_id, auth.uid(), v_doc.status, p_status, v_feedback);

  perform public.audit('document.reviewed', 'document', v_doc.id::text,
    jsonb_build_object('from', v_doc.status, 'to', p_status, 'version_id', v_doc.current_version_id));

  if p_status <> 'under_review' then
    perform public.notify(v_doc.owner_id, 'document',
      case p_status
        when 'verified' then 'Document verified'
        when 'correction_required' then 'Correction requested'
        else 'Document not accepted'
      end,
      '"' || v_doc.title || '": ' || case p_status
        when 'verified' then 'GlobalPath has completed its internal review of this document.'
        when 'correction_required' then 'please read the reviewer feedback and upload a replacement.'
        else 'please read the reviewer feedback.'
      end,
      '/portal/verification');
  end if;
end $$;

-- Student: submit (or resubmit) an application to GlobalPath for review.
create function public.submit_application(p_application_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_app public.applications;
begin
  select * into v_app from public.applications where id = p_application_id and student_id = auth.uid() for update;
  if not found then
    raise exception 'Application not found' using errcode = '42501';
  end if;
  if v_app.status not in ('draft', 'missing_documents', 'correction_required') then
    raise exception 'This application has already been submitted' using errcode = '22023';
  end if;
  if v_app.course_id is null then
    raise exception 'Choose a programme before submitting' using errcode = '22023';
  end if;
  if not exists (select 1 from public.application_documents ad where ad.application_id = v_app.id) then
    raise exception 'Attach at least one document before submitting' using errcode = '22023';
  end if;

  update public.applications set status = 'submitted', submitted_at = now() where id = v_app.id;
  insert into public.application_status_history (application_id, from_status, to_status, changed_by, note)
  values (v_app.id, v_app.status, 'submitted', auth.uid(), null);
  perform public.audit('application.submitted', 'application', v_app.id::text, '{}'::jsonb);
  perform public.notify(v_app.student_id, 'application', 'Application submitted to GlobalPath',
    v_app.reference || ' was sent to GlobalPath for internal review.', '/portal/applications/' || v_app.id);
end $$;

-- Student: withdraw, or pull a submitted application back to draft
-- before GlobalPath has started reviewing it.
create function public.student_update_application_status(p_application_id uuid, p_status public.application_status)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_app public.applications;
begin
  select * into v_app from public.applications where id = p_application_id and student_id = auth.uid() for update;
  if not found then
    raise exception 'Application not found' using errcode = '42501';
  end if;
  if p_status = 'withdrawn' and v_app.status not in ('closed', 'withdrawn') then
    null;
  elsif p_status = 'draft' and v_app.status = 'submitted' then
    null;
  else
    raise exception 'That change is not available for this application' using errcode = '22023';
  end if;

  update public.applications set status = p_status where id = v_app.id;
  insert into public.application_status_history (application_id, from_status, to_status, changed_by, note)
  values (v_app.id, v_app.status, p_status, auth.uid(), null);
  perform public.audit('application.status_changed', 'application', v_app.id::text,
    jsonb_build_object('from', v_app.status, 'to', p_status, 'by', 'student'));
end $$;

-- Staff: move an application through GlobalPath's internal review.
create function public.staff_set_application_status(p_application_id uuid, p_status public.application_status, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_app public.applications;
  v_note text := nullif(trim(p_note), '');
begin
  select * into v_app from public.applications where id = p_application_id for update;
  if not found or not public.staff_can_access(v_app.student_id) then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_status in ('draft', 'withdrawn') then
    raise exception 'Only the student can set that status' using errcode = '22023';
  end if;
  if v_app.status in ('draft', 'withdrawn') then
    raise exception 'The student has not submitted this application' using errcode = '22023';
  end if;
  if p_status in ('missing_documents', 'correction_required') and v_note is null then
    raise exception 'Add feedback so the student knows what to change' using errcode = '22023';
  end if;
  if char_length(v_note) > 4000 then
    raise exception 'Feedback is too long' using errcode = '22023';
  end if;

  update public.applications
     set status = p_status, staff_feedback = coalesce(v_note, staff_feedback)
   where id = v_app.id;
  insert into public.application_status_history (application_id, from_status, to_status, changed_by, note)
  values (v_app.id, v_app.status, p_status, auth.uid(), v_note);
  perform public.audit('application.status_changed', 'application', v_app.id::text,
    jsonb_build_object('from', v_app.status, 'to', p_status, 'by', 'staff'));
  perform public.notify(v_app.student_id, 'application', 'Application status updated',
    v_app.reference || ' has a new status in GlobalPath''s review.', '/portal/applications/' || v_app.id);
end $$;

-- Staff: update a consultation request a student made while signed in.
create function public.staff_update_consultation(p_id uuid, p_status public.consultation_status, p_confirmed_for timestamptz, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_req public.consultation_requests;
begin
  select * into v_req from public.consultation_requests where id = p_id for update;
  if not found or not public.staff_can_access(v_req.user_id) then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_status = 'confirmed' and p_confirmed_for is null then
    raise exception 'Set the confirmed date and time' using errcode = '22023';
  end if;
  update public.consultation_requests
     set status = p_status,
         confirmed_for = case when p_status = 'confirmed' then p_confirmed_for else confirmed_for end,
         staff_note = left(nullif(trim(p_note), ''), 1000)
   where id = p_id;
  perform public.audit('consultation.updated', 'consultation_request', p_id::text,
    jsonb_build_object('from', v_req.status, 'to', p_status));
  if p_status = 'confirmed' and v_req.status <> 'confirmed' then
    perform public.notify(v_req.user_id, 'consultation', 'Consultation confirmed',
      'GlobalPath confirmed your consultation. See the time in your portal.', '/portal/consultations');
  end if;
end $$;

-- Admin: grant, change or remove a staff role by email.
create function public.admin_set_staff_role(p_email text, p_role public.staff_role)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_target uuid;
  v_old public.staff_role;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  select id into v_target from public.profiles where lower(email) = lower(trim(p_email));
  if v_target is null then
    raise exception 'No account uses that email address. The person must register first.' using errcode = '22023';
  end if;
  if v_target = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '22023';
  end if;
  select role into v_old from public.staff_roles where user_id = v_target;

  if p_role is null then
    delete from public.staff_roles where user_id = v_target;
  else
    insert into public.staff_roles (user_id, role, granted_by) values (v_target, p_role, auth.uid())
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by, granted_at = now();
  end if;
  perform public.audit('staff.role_changed', 'profile', v_target::text,
    jsonb_build_object('from', v_old, 'to', p_role));
end $$;

-- Admin: assign / unassign a reviewer to a student.
create function public.admin_assign_reviewer(p_reviewer uuid, p_student uuid, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if not exists (select 1 from public.staff_roles where user_id = p_reviewer) then
    raise exception 'That person is not a staff member' using errcode = '22023';
  end if;
  if exists (select 1 from public.staff_roles where user_id = p_student) then
    raise exception 'Staff accounts cannot be assigned as students' using errcode = '22023';
  end if;
  insert into public.reviewer_assignments (reviewer_id, student_id, assigned_by, active)
  values (p_reviewer, p_student, auth.uid(), p_active)
  on conflict (reviewer_id, student_id) do update set active = excluded.active, assigned_by = excluded.assigned_by;
  perform public.audit(case when p_active then 'reviewer.assigned' else 'reviewer.unassigned' end,
    'profile', p_student::text, jsonb_build_object('reviewer', p_reviewer));
end $$;

-- Student: ask GlobalPath to delete the account and its data.
create function public.request_account_deletion()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set deletion_requested_at = now()
   where id = auth.uid() and deletion_requested_at is null;
  perform public.audit('account.deletion_requested', 'profile', auth.uid()::text, '{}'::jsonb);
end $$;

-- =====================================================================
-- Row Level Security and grants
-- =====================================================================
alter table public.portal_config enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_roles enable row level security;
alter table public.reviewer_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.academic_qualifications enable row level security;
alter table public.language_qualifications enable row level security;
alter table public.universities enable row level security;
alter table public.courses enable row level security;
alter table public.shortlist_items enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.document_categories enable row level security;
alter table public.document_requirements enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_reviews enable row level security;
alter table public.application_documents enable row level security;
alter table public.messages enable row level security;
alter table public.consultation_requests enable row level security;

-- Start from nothing, then grant precisely. The anonymous role gets no
-- access to any portal table.
revoke all on
  public.portal_config, public.profiles, public.staff_roles, public.reviewer_assignments,
  public.notifications, public.audit_logs, public.academic_qualifications,
  public.language_qualifications, public.universities, public.courses, public.shortlist_items,
  public.applications, public.application_status_history, public.document_categories,
  public.document_requirements, public.documents, public.document_versions,
  public.document_reviews, public.application_documents, public.messages,
  public.consultation_requests
from anon, authenticated;
revoke all on sequence public.applicant_ref_seq from anon, authenticated;

grant select on
  public.portal_config, public.profiles, public.staff_roles, public.reviewer_assignments,
  public.notifications, public.audit_logs, public.academic_qualifications,
  public.language_qualifications, public.universities, public.courses, public.shortlist_items,
  public.applications, public.application_status_history, public.document_categories,
  public.document_requirements, public.documents, public.document_versions,
  public.document_reviews, public.application_documents, public.messages,
  public.consultation_requests
to authenticated;

-- portal_config / document_categories: readable configuration
create policy "config readable" on public.portal_config for select to authenticated using (true);
create policy "categories readable" on public.document_categories for select to authenticated using (true);

-- profiles
grant update (first_name, last_name, date_of_birth, nationality, country_of_residence, phone, preferred_destination)
  on public.profiles to authenticated;
create policy "profiles select" on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.staff_can_access(id)
  or (public.is_staff() and exists (select 1 from public.staff_roles sr where sr.user_id = profiles.id))
);
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- staff_roles / reviewer_assignments: read-only to clients (changed via admin functions)
create policy "staff_roles select" on public.staff_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "assignments select" on public.reviewer_assignments for select to authenticated
  using (reviewer_id = auth.uid() or public.is_admin());

-- notifications
grant update (read_at) on public.notifications to authenticated;
create policy "notifications select own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications update own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit log: administrators only
create policy "audit admin read" on public.audit_logs for select to authenticated using (public.is_admin());

-- academic & language qualifications: student owns; assigned staff read
grant insert (level, institution, country, qualification_name, field_of_study, start_date, end_date, graduation_status, grade, grading_system),
      update (level, institution, country, qualification_name, field_of_study, start_date, end_date, graduation_status, grade, grading_system),
      delete
  on public.academic_qualifications to authenticated;
create policy "academic select" on public.academic_qualifications for select to authenticated
  using (student_id = auth.uid() or public.staff_can_access(student_id));
create policy "academic insert own" on public.academic_qualifications for insert to authenticated with check (student_id = auth.uid());
create policy "academic update own" on public.academic_qualifications for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "academic delete own" on public.academic_qualifications for delete to authenticated using (student_id = auth.uid());

grant insert (test, test_name_other, language, result, sub_scores, test_date, certificate_document_id),
      update (test, test_name_other, language, result, sub_scores, test_date, certificate_document_id),
      delete
  on public.language_qualifications to authenticated;
create policy "language select" on public.language_qualifications for select to authenticated
  using (student_id = auth.uid() or public.staff_can_access(student_id));
create policy "language insert own" on public.language_qualifications for insert to authenticated with check (student_id = auth.uid());
create policy "language update own" on public.language_qualifications for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "language delete own" on public.language_qualifications for delete to authenticated using (student_id = auth.uid());

-- catalogue: students see published listings; administrators manage
grant insert, update, delete on public.universities, public.courses to authenticated;
create policy "universities select" on public.universities for select to authenticated using (published or public.is_staff());
create policy "universities admin insert" on public.universities for insert to authenticated with check (public.is_admin());
create policy "universities admin update" on public.universities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "universities admin delete" on public.universities for delete to authenticated using (public.is_admin());
create policy "courses select" on public.courses for select to authenticated using (
  public.is_staff()
  or (published and exists (select 1 from public.universities u where u.id = courses.university_id and u.published))
);
create policy "courses admin insert" on public.courses for insert to authenticated with check (public.is_admin());
create policy "courses admin update" on public.courses for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "courses admin delete" on public.courses for delete to authenticated using (public.is_admin());

grant insert (university_id, course_id), delete on public.shortlist_items to authenticated;
create policy "shortlist own select" on public.shortlist_items for select to authenticated using (student_id = auth.uid());
create policy "shortlist own insert" on public.shortlist_items for insert to authenticated with check (student_id = auth.uid());
create policy "shortlist own delete" on public.shortlist_items for delete to authenticated using (student_id = auth.uid());

-- document requirements: everyone signed in reads; administrators manage
grant insert, update, delete on public.document_requirements to authenticated;
create policy "requirements select" on public.document_requirements for select to authenticated using (true);
create policy "requirements admin insert" on public.document_requirements for insert to authenticated with check (public.is_admin());
create policy "requirements admin update" on public.document_requirements for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "requirements admin delete" on public.document_requirements for delete to authenticated using (public.is_admin());

-- applications: student edits only while the record is editable;
-- status changes only via the workflow functions above.
grant insert (course_id, intake, student_notes),
      update (course_id, intake, student_notes),
      delete
  on public.applications to authenticated;
create policy "applications select" on public.applications for select to authenticated
  using (student_id = auth.uid() or public.staff_can_access(student_id));
create policy "applications insert own" on public.applications for insert to authenticated
  with check (student_id = auth.uid() and status = 'draft');
create policy "applications update own editable" on public.applications for update to authenticated
  using (student_id = auth.uid() and status in ('draft', 'missing_documents', 'correction_required'))
  with check (student_id = auth.uid() and status in ('draft', 'missing_documents', 'correction_required'));
create policy "applications delete own draft" on public.applications for delete to authenticated
  using (student_id = auth.uid() and status = 'draft');

create policy "history select" on public.application_status_history for select to authenticated using (
  exists (select 1 from public.applications a where a.id = application_id
          and (a.student_id = auth.uid() or public.staff_can_access(a.student_id)))
);

-- documents: read own or as authorised staff; all writes via functions / server
create policy "documents select" on public.documents for select to authenticated
  using (owner_id = auth.uid() or public.staff_can_access(owner_id));
create policy "versions select" on public.document_versions for select to authenticated using (
  exists (select 1 from public.documents d where d.id = document_id
          and (d.owner_id = auth.uid() or public.staff_can_access(d.owner_id)))
);
create policy "reviews select" on public.document_reviews for select to authenticated using (
  exists (select 1 from public.documents d where d.id = document_id
          and (d.owner_id = auth.uid() or public.staff_can_access(d.owner_id)))
);

-- attach / detach the student's own documents to their editable applications
grant insert (application_id, document_id), delete on public.application_documents to authenticated;
create policy "app docs select" on public.application_documents for select to authenticated using (
  exists (select 1 from public.applications a where a.id = application_id
          and (a.student_id = auth.uid() or public.staff_can_access(a.student_id)))
);
create policy "app docs insert own" on public.application_documents for insert to authenticated with check (
  exists (select 1 from public.applications a where a.id = application_id and a.student_id = auth.uid()
          and a.status in ('draft', 'missing_documents', 'correction_required'))
  and exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()
          and (d.application_id is null or d.application_id = application_documents.application_id))
);
create policy "app docs delete own" on public.application_documents for delete to authenticated using (
  exists (select 1 from public.applications a where a.id = application_id and a.student_id = auth.uid()
          and a.status in ('draft', 'missing_documents', 'correction_required'))
);

-- messages between a student and authorised staff
grant insert (student_id, body) on public.messages to authenticated;
create policy "messages select" on public.messages for select to authenticated
  using (student_id = auth.uid() or public.staff_can_access(student_id));
create policy "messages insert" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and (student_id = auth.uid() or public.staff_can_access(student_id))
);

-- consultation requests: the signed-in student creates their own
grant insert (service, destination, preferred_date, message) on public.consultation_requests to authenticated;
create policy "consultations select" on public.consultation_requests for select to authenticated
  using (user_id = auth.uid() or public.staff_can_access(user_id));
create policy "consultations insert own" on public.consultation_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'requested');

-- ---------------------------------------------------------------------
-- Function privileges: internal helpers are not callable by clients.
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
revoke execute on function
  public.notify(uuid, text, text, text, text),
  public.audit(text, text, text, jsonb),
  public.finalize_document_version(uuid, text, public.scan_status),
  public.handle_new_user(),
  public.handle_user_email_change(),
  public.next_applicant_ref()
from authenticated;
grant execute on function public.finalize_document_version(uuid, text, public.scan_status) to service_role;
grant execute on function
  public.current_staff_role(), public.is_admin(), public.is_staff(), public.staff_can_access(uuid),
  public.begin_document_upload(uuid, text, text, uuid, text, text, int),
  public.staff_review_document(uuid, public.document_status, text),
  public.submit_application(uuid),
  public.student_update_application_status(uuid, public.application_status),
  public.staff_set_application_status(uuid, public.application_status, text),
  public.staff_update_consultation(uuid, public.consultation_status, timestamptz, text),
  public.admin_set_staff_role(text, public.staff_role),
  public.admin_assign_reviewer(uuid, uuid, boolean),
  public.request_account_deletion()
to authenticated;

-- =====================================================================
-- Private storage bucket. No storage.objects policies are created, so
-- browsers can never list, read or write files directly; the server
-- issues single-path signed upload URLs and 60-second download URLs.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-documents', 'student-documents', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
