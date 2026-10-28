import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Alert, Card, Field, PageHeader, StatusBadge, TextAreaField, inputClass, labelClass } from "@/components/portal/ui";
import { assignReviewerAction, deleteStudentAccountAction, sendStaffMessageAction } from "../../actions";
import { requireStaff } from "@/lib/portal/auth";
import { applicationStatuses, consultationStatuses, documentStatuses, formatDate, graduationStatuses, qualificationLevels } from "@/lib/portal/constants";
import { isUuid } from "@/lib/portal/validation";
import type { AcademicQualification, Application, ConsultationRequest, DocumentRow, LanguageQualification, Profile } from "@/lib/portal/types";

export const metadata = { title: "Student" };

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, role } = await requireStaff(`/admin/students/${id}`);

  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const profile = p as Profile;

  const [{ data: academic }, { data: language }, { data: docs }, { data: apps }, { data: consults }, { data: msgs }, { data: assignments }, { data: staff }] = await Promise.all([
    supabase.from("academic_qualifications").select("*").eq("student_id", id).order("end_date", { ascending: false }),
    supabase.from("language_qualifications").select("*").eq("student_id", id),
    supabase.from("documents").select("*").eq("owner_id", id).order("updated_at", { ascending: false }),
    supabase.from("applications").select("*").eq("student_id", id).order("updated_at", { ascending: false }),
    supabase.from("consultation_requests").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("messages").select("id, sender_id, body, created_at").eq("student_id", id).order("created_at").limit(200),
    role === "admin" ? supabase.from("reviewer_assignments").select("reviewer_id, active").eq("student_id", id) : Promise.resolve({ data: [] }),
    role === "admin" ? supabase.from("staff_roles").select("user_id, role, profiles!staff_roles_user_id_fkey(first_name, last_name, email)") : Promise.resolve({ data: [] }),
  ]);
  type StaffRow = { user_id: string; role: string; profiles: { first_name: string; last_name: string; email: string } | null };
  const staffList = (staff ?? []) as unknown as StaffRow[];
  const staffName = (uid: string | null) => {
    const s = staffList.find((x) => x.user_id === uid)?.profiles;
    return s ? `${s.first_name} ${s.last_name}`.trim() || s.email : "GlobalPath";
  };
  const activeReviewers = (assignments ?? []).filter((a) => a.active).map((a) => a.reviewer_id);

  return (
    <div className="grid gap-6">
      <PageHeader title={`${profile.first_name} ${profile.last_name}`.trim() || profile.email} intro={<>{profile.applicant_ref} · {profile.email}</>} />
      {profile.deletion_requested_at && <Alert tone="warn">The student requested account deletion on {formatDate(profile.deletion_requested_at)}.</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Personal information">
          <dl className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
            <dt className="text-ink-faint">Date of birth</dt><dd>{formatDate(profile.date_of_birth)}</dd>
            <dt className="text-ink-faint">Nationality</dt><dd>{profile.nationality ?? "—"}</dd>
            <dt className="text-ink-faint">Residence</dt><dd>{profile.country_of_residence ?? "—"}</dd>
            <dt className="text-ink-faint">Phone</dt><dd>{profile.phone ?? "—"}</dd>
            <dt className="text-ink-faint">Destination</dt><dd>{profile.preferred_destination ?? "—"}</dd>
            <dt className="text-ink-faint">Registered</dt><dd>{formatDate(profile.created_at)}</dd>
          </dl>
        </Card>
        <Card title="Education & languages">
          <ul className="grid gap-2 text-sm">
            {((academic ?? []) as AcademicQualification[]).map((q) => (
              <li key={q.id}>
                <span className="font-semibold">{q.qualification_name}</span> – {q.institution}, {q.country}
                <span className="block text-ink-muted">
                  {qualificationLevels[q.level]} · {graduationStatuses[q.graduation_status as keyof typeof graduationStatuses]} · {formatDate(q.end_date)}
                  {q.grade ? ` · ${q.grade}${q.grading_system ? ` (${q.grading_system})` : ""}` : ""}
                </span>
              </li>
            ))}
            {((language ?? []) as LanguageQualification[]).map((l) => (
              <li key={l.id}>
                <span className="font-semibold">{l.test === "Other" ? l.test_name_other : l.test}</span> ({l.language}): {l.result}
                {l.sub_scores && <span className="text-ink-muted"> · {l.sub_scores}</span>}
              </li>
            ))}
            {(academic ?? []).length + (language ?? []).length === 0 && <li className="text-ink-muted">Nothing entered yet.</li>}
          </ul>
        </Card>
      </div>

      <Card title="Documents">
        {(docs ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">No documents.</p>
        ) : (
          <ul className="divide-y divide-line">
            {((docs ?? []) as DocumentRow[]).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/admin/documents/${d.id}`} className="font-semibold text-navy hover:underline">{d.title}</Link>
                <StatusBadge status={d.status} map={documentStatuses} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Applications">
          {(apps ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">No applications.</p>
          ) : (
            <ul className="divide-y divide-line">
              {((apps ?? []) as Application[]).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span>
                    <Link href={`/admin/applications/${a.id}`} className="font-semibold text-navy hover:underline">{a.reference}</Link>
                    <span className="block text-ink-muted">{a.programme_snapshot}</span>
                  </span>
                  <StatusBadge status={a.status} map={applicationStatuses} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Consultation requests (from portal)">
          {(consults ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">None submitted while signed in.</p>
          ) : (
            <ul className="divide-y divide-line">
              {((consults ?? []) as ConsultationRequest[]).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span>{c.service} · {formatDate(c.created_at)}</span>
                  <StatusBadge status={c.status} map={consultationStatuses} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/consultations" className="mt-3 inline-block text-sm font-semibold text-navy hover:underline">Manage consultations</Link>
        </Card>
      </div>

      <Card title="Messages">
        <div className="grid max-h-[420px] gap-3 overflow-y-auto">
          {(msgs ?? []).length === 0 && <p className="text-sm text-ink-muted">No messages yet.</p>}
          {(msgs ?? []).map((m) => {
            const fromStudent = m.sender_id === id;
            return (
              <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${fromStudent ? "bg-canvas ring-1 ring-line" : "ml-auto bg-navy text-white"}`}>
                <p className="whitespace-pre-line">{m.body}</p>
                <p className={`mt-1 text-xs ${fromStudent ? "text-ink-faint" : "text-white/70"}`}>
                  {fromStudent ? "Student" : role === "admin" ? staffName(m.sender_id) : "GlobalPath"} · {formatDate(m.created_at, true)}
                </p>
              </div>
            );
          })}
        </div>
        <ActionForm action={sendStaffMessageAction} className="mt-4 grid gap-3" resetOnSuccess>
          <input type="hidden" name="student_id" value={id} />
          <TextAreaField label="Message to student" name="body" rows={3} maxLength={4000} hint="The student gets an in-app notification and a generic email alert." />
          <div>
            <SubmitButton pendingText="Sending…">Send</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      {role === "admin" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Reviewer assignment" description="Reviewers can only see students assigned to them.">
            <p className="mb-3 text-sm text-ink-muted">
              Assigned: {activeReviewers.length ? activeReviewers.map(staffName).join(", ") : "nobody"}
            </p>
            <ActionForm action={assignReviewerAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <input type="hidden" name="student_id" value={id} />
              <div>
                <label htmlFor="reviewer_id" className={labelClass}>Staff member</label>
                <select id="reviewer_id" name="reviewer_id" className={inputClass} required>
                  <option value="">Select…</option>
                  {staffList.map((s) => (
                    <option key={s.user_id} value={s.user_id}>{staffName(s.user_id)} ({s.role})</option>
                  ))}
                </select>
              </div>
              <select name="active" className={inputClass} aria-label="Assign or unassign">
                <option value="1">Assign</option>
                <option value="0">Unassign</option>
              </select>
              <SubmitButton variant="navy">Save</SubmitButton>
            </ActionForm>
          </Card>
          <Card title="Delete account" description="Permanently deletes the account, profile, applications and all stored files. This cannot be undone.">
            <ActionForm action={deleteStudentAccountAction} className="grid gap-3">
              <input type="hidden" name="student_id" value={id} />
              <Field label={`Type ${profile.applicant_ref} to confirm`} name="confirm" autoComplete="off" />
              <div>
                <SubmitButton variant="danger" pendingText="Deleting…">Delete account and documents</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        </div>
      )}
    </div>
  );
}
