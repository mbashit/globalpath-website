-- =====================================================================
-- Application fee: each application must be paid for (once) before it can
-- be submitted to GlobalPath. Payments are recorded only by the server
-- (service role) after Paystack confirms the charge; students and staff can
-- read them but never write them.
-- =====================================================================

create table public.application_payments (
  id uuid primary key default gen_random_uuid(),
  -- Kept (with the link cleared) if an application or account is deleted,
  -- so the financial record survives.
  application_id uuid unique references public.applications (id) on delete set null,
  student_id uuid references public.profiles (id) on delete set null,
  provider text not null default 'paystack' check (provider in ('paystack')),
  reference text not null unique check (char_length(reference) between 1 and 100),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index application_payments_student_idx on public.application_payments (student_id);

alter table public.application_payments enable row level security;
revoke all on public.application_payments from anon, authenticated;
grant select on public.application_payments to authenticated;
create policy "payments select own or staff" on public.application_payments for select to authenticated
  using (student_id = auth.uid() or public.staff_can_access(student_id));

-- Submitting now also requires a recorded fee payment. Resubmitting after
-- corrections does not charge again: one payment covers the application.
create or replace function public.submit_application(p_application_id uuid)
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
  if not exists (select 1 from public.application_payments p where p.application_id = v_app.id) then
    raise exception 'Pay the application fee before submitting' using errcode = '22023';
  end if;

  update public.applications set status = 'submitted', submitted_at = now() where id = v_app.id;
  insert into public.application_status_history (application_id, from_status, to_status, changed_by, note)
  values (v_app.id, v_app.status, 'submitted', auth.uid(), null);
  perform public.audit('application.submitted', 'application', v_app.id::text, '{}'::jsonb);
  perform public.notify(v_app.student_id, 'application', 'Application submitted to GlobalPath',
    v_app.reference || ' was sent to GlobalPath for internal review.', '/portal/applications/' || v_app.id);
end $$;
revoke execute on function public.submit_application(uuid) from public, anon;
grant execute on function public.submit_application(uuid) to authenticated;

-- A paid draft cannot be deleted by the student (the payment would be orphaned).
drop policy "applications delete own draft" on public.applications;
create policy "applications delete own draft" on public.applications for delete to authenticated
  using (
    student_id = auth.uid() and status = 'draft'
    and not exists (select 1 from public.application_payments p where p.application_id = applications.id)
  );
