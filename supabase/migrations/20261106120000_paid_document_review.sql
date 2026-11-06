-- =====================================================================
-- Document reviews are part of the paid service: staff can review a
-- document only once it is attached to an application that has been paid
-- for and submitted. Students can still upload freely.
-- =====================================================================

-- True when the document belongs to a paid application that has been
-- submitted (any status after draft, except withdrawn). Also usable as a
-- PostgREST computed column: documents?select=*,review_unlocked
create function public.review_unlocked(d public.documents) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.application_documents ad
    join public.applications a on a.id = ad.application_id
    join public.application_payments p on p.application_id = a.id
    where ad.document_id = d.id
      and a.status not in ('draft', 'withdrawn')
  )
$$;
revoke execute on function public.review_unlocked(public.documents) from public, anon;
grant execute on function public.review_unlocked(public.documents) to authenticated;

-- Staff: change a document's verification status (now only for paid,
-- submitted applications).
create or replace function public.staff_review_document(p_document_id uuid, p_status public.document_status, p_feedback text)
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
  if not public.review_unlocked(v_doc) then
    raise exception 'This document is not part of a paid, submitted application yet' using errcode = '22023';
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
revoke execute on function public.staff_review_document(uuid, public.document_status, text) from public, anon;
grant execute on function public.staff_review_document(uuid, public.document_status, text) to authenticated;

-- Server only: same as before, but the upload notification no longer
-- promises an immediate review.
create or replace function public.finalize_document_version(p_version_id uuid, p_sha256 text, p_scan public.scan_status)
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
    '"' || v_doc.title || '" was uploaded. GlobalPath reviews it once you pay for and submit an application that includes it.', '/portal/documents');
  return v_new_status;
end $$;
revoke execute on function public.finalize_document_version(uuid, text, public.scan_status) from public, anon, authenticated;
grant execute on function public.finalize_document_version(uuid, text, public.scan_status) to service_role;
