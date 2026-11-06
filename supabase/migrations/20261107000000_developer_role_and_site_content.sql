-- =====================================================================
-- 1. Developer role: a hidden super-administrator.
--    * Has every administrator power, plus granting/removing administrators.
--    * Invisible to administrators and reviewers: developer accounts do not
--      appear in staff lists, student lists, profile lookups or the audit
--      log, and cannot be found or changed by email.
-- 2. Editable website content: site photos and testimonials, managed by
--    administrators; students can submit a story for approval.
--
-- The new enum value is compared as text ('developer') throughout, because
-- Postgres does not allow a freshly added enum value to be used in the same
-- transaction that adds it.
-- =====================================================================

alter type public.staff_role add value if not exists 'developer';

-- ---------------------------------------------------------------- helpers
create or replace function public.is_developer() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_staff_role()::text = 'developer', false)
$$;

-- True when the given account id (as text) holds the developer role.
-- Takes text so audit-log entity ids can be checked without a cast.
create or replace function public.is_developer_account(p_user text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_roles sr where sr.user_id::text = p_user and sr.role::text = 'developer')
$$;

-- Developers hold every administrator power.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_staff_role()::text in ('admin', 'developer'), false)
$$;

-- Administrators see every student except developer accounts.
create or replace function public.staff_can_access(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case public.current_staff_role()::text
    when 'developer' then true
    when 'admin' then not public.is_developer_account(p_student::text)
    when 'reviewer' then exists (
      select 1 from public.reviewer_assignments ra
      where ra.reviewer_id = auth.uid() and ra.student_id = p_student and ra.active
    )
    else false
  end
$$;

revoke execute on function public.is_developer(), public.is_developer_account(text) from public, anon;
grant execute on function public.is_developer(), public.is_developer_account(text) to authenticated;

-- ------------------------------------------------- hide developer accounts
drop policy "staff_roles select" on public.staff_roles;
create policy "staff_roles select" on public.staff_roles for select to authenticated using (
  user_id = auth.uid()
  or (public.is_staff() and (role::text <> 'developer' or public.is_developer()))
);

drop policy "assignments select" on public.reviewer_assignments;
create policy "assignments select" on public.reviewer_assignments for select to authenticated using (
  reviewer_id = auth.uid()
  or (public.is_admin() and (public.is_developer() or not public.is_developer_account(reviewer_id::text)))
);

drop policy "audit admin read" on public.audit_logs;
create policy "audit admin read" on public.audit_logs for select to authenticated using (
  public.is_admin()
  and (
    public.is_developer()
    or (
      not public.is_developer_account(actor_id::text)
      and not (entity = 'profile' and public.is_developer_account(entity_id))
    )
  )
);

-- Grant, change or remove a staff role by email.
-- Administrators manage reviewers only; administrator and developer access
-- is managed by a developer. Developer accounts look like unknown emails to
-- everyone else.
create or replace function public.admin_set_staff_role(p_email text, p_role public.staff_role)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_target uuid;
  v_old public.staff_role;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  select id into v_target from public.profiles where lower(email) = lower(trim(p_email));
  if v_target is not null and not public.is_developer() and public.is_developer_account(v_target::text) then
    v_target := null;
  end if;
  if v_target is null then
    raise exception 'No account uses that email address. The person must register first.' using errcode = '22023';
  end if;
  if v_target = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '22023';
  end if;
  select role into v_old from public.staff_roles where user_id = v_target;

  if not public.is_developer()
     and (coalesce(p_role::text, '') in ('admin', 'developer') or coalesce(v_old::text, '') in ('admin', 'developer')) then
    raise exception 'Administrator access is managed by GlobalPath technical support' using errcode = '42501';
  end if;

  if p_role is null then
    delete from public.staff_roles where user_id = v_target;
  else
    insert into public.staff_roles (user_id, role, granted_by) values (v_target, p_role, auth.uid())
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by, granted_at = now();
  end if;
  perform public.audit('staff.role_changed', 'profile', v_target::text,
    jsonb_build_object('from', v_old, 'to', p_role));
end $$;

-- Assign / unassign a reviewer; developer accounts are not assignable by administrators.
create or replace function public.admin_assign_reviewer(p_reviewer uuid, p_student uuid, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if not exists (select 1 from public.staff_roles where user_id = p_reviewer)
     or (not public.is_developer() and public.is_developer_account(p_reviewer::text)) then
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

-- =====================================================================
-- Website content
-- =====================================================================

-- Photo slots on the public site. A row overrides the built-in photo for
-- that slot; deleting the row restores the original.
create table public.site_images (
  key text primary key check (key ~ '^[a-z0-9-]{2,40}$'),
  src text not null check (src ~ '^(/images/|https://)'),
  alt text not null check (char_length(alt) between 3 and 200),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.site_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null check (char_length(quote) between 20 and 800),
  name text not null check (char_length(name) between 2 and 80),
  context text not null default '' check (char_length(context) <= 120),
  destination text not null default '' check (char_length(destination) <= 60),
  image_src text check (image_src is null or image_src ~ '^(/images/|https://)'),
  image_alt text check (image_alt is null or char_length(image_alt) <= 200),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  sort_order int not null default 100,
  submitted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index site_testimonials_status_idx on public.site_testimonials (status, sort_order);
create trigger site_testimonials_updated_at before update on public.site_testimonials
  for each row execute function public.set_updated_at();

alter table public.site_images enable row level security;
alter table public.site_testimonials enable row level security;
revoke all on public.site_images, public.site_testimonials from anon, authenticated;

-- Public pages read published content with the anonymous key.
grant select on public.site_images to anon, authenticated;
grant select (id, quote, name, context, destination, image_src, image_alt, status, sort_order)
  on public.site_testimonials to anon;
grant select on public.site_testimonials to authenticated;
grant insert, update, delete on public.site_images, public.site_testimonials to authenticated;

create policy "site_images public read" on public.site_images for select to anon, authenticated using (true);
create policy "site_images admin write" on public.site_images for insert to authenticated with check (public.is_admin());
create policy "site_images admin update" on public.site_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "site_images admin delete" on public.site_images for delete to authenticated using (public.is_admin());

create policy "testimonials public read" on public.site_testimonials for select to anon using (status = 'published');
create policy "testimonials read" on public.site_testimonials for select to authenticated
  using (status = 'published' or submitted_by = auth.uid() or public.is_admin());
create policy "testimonials admin insert" on public.site_testimonials for insert to authenticated with check (public.is_admin());
create policy "testimonials admin update" on public.site_testimonials for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "testimonials admin delete" on public.site_testimonials for delete to authenticated using (public.is_admin());

-- Student: submit a story for GlobalPath to approve. At most three waiting at once.
create function public.submit_testimonial(p_quote text, p_name text, p_context text, p_destination text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if (select count(*) from public.site_testimonials where submitted_by = auth.uid() and status = 'pending') >= 3 then
    raise exception 'You already have stories waiting for review' using errcode = '22023';
  end if;
  insert into public.site_testimonials (quote, name, context, destination, status, submitted_by)
  values (trim(p_quote), trim(p_name), coalesce(trim(p_context), ''), coalesce(trim(p_destination), ''), 'pending', auth.uid())
  returning id into v_id;
  perform public.audit('testimonial.submitted', 'site_testimonial', v_id::text, '{}'::jsonb);
  return v_id;
end $$;
revoke execute on function public.submit_testimonial(text, text, text, text) from public, anon;
grant execute on function public.submit_testimonial(text, text, text, text) to authenticated;

-- The stories shown on the site today, so nothing changes until an
-- administrator edits them. They are samples: replace or hide them.
insert into public.site_testimonials (quote, name, context, destination, image_src, image_alt, status, sort_order) values
  ('I didn''t know where to start with the blocked account and APS certificate. The team broke everything into clear steps, checked my documents before submission, and I''m now studying engineering in Munich.',
   'Chinedu O.', 'Master''s student · Lagos, Nigeria', 'Germany', '/images/testimonials/chinedu.jpg', 'Portrait of Chinedu O.', 'published', 10),
  ('As a parent sponsoring my daughter, I had many questions about proof of funds. They explained exactly what the visa office expects and helped us organise genuine documents. She started college in Toronto this fall.',
   'Mrs. Amina B.', 'Parent & sponsor · Abuja, Nigeria', 'Canada', '/images/testimonials/amina.jpg', 'Portrait of Mrs. Amina B.', 'published', 20),
  ('From shortlisting universities to preparing for my CAS and visa, I always knew what came next. The pre-departure briefing made my first weeks in Manchester much easier.',
   'Kwame A.', 'Undergraduate student · Accra, Ghana', 'United Kingdom', '/images/testimonials/kwame.jpg', 'Portrait of Kwame A.', 'published', 30),
  ('The translation and notarization coordination saved me weeks. My adviser was patient, honest about timelines, and helped me prepare confidently for my F-1 interview.',
   'Grace M.', 'Graduate student · Nairobi, Kenya', 'United States', '/images/testimonials/grace.jpg', 'Portrait of Grace M.', 'published', 40);

-- Public bucket for website photos. Uploads happen on the server after an
-- administrator check; there are no browser write policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
