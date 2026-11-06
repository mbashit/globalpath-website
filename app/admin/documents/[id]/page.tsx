import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Alert, Card, PageHeader, StatusBadge, TextAreaField, buttonClass, inputClass, labelClass } from "@/components/portal/ui";
import { reviewDocumentAction } from "../../actions";
import { requireStaff } from "@/lib/portal/auth";
import { documentStatuses, formatBytes, formatDate, scanStatuses, staffDocumentDecisions, type DocumentStatus } from "@/lib/portal/constants";
import { isUuid } from "@/lib/portal/validation";
import type { DocumentRow, DocumentVersion } from "@/lib/portal/types";

export const metadata = { title: "Review document" };

const checklist = [
  "The whole document is visible (all pages, no cropped edges).",
  "Text, stamps and signatures are legible.",
  "The name matches the student's profile (or the difference is explained).",
  "It matches the selected category and the student's stated qualification.",
  "No signs of alteration. Escalate concerns instead of approving.",
];

export default async function ReviewDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, role } = await requireStaff(`/admin/documents/${id}`);
  const { data } = await supabase
    .from("documents")
    .select("*, review_unlocked, document_versions(*), profiles!documents_owner_id_fkey(id, first_name, last_name, applicant_ref, date_of_birth, nationality)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const doc = data as DocumentRow & {
    review_unlocked: boolean;
    document_versions: DocumentVersion[];
    profiles: { id: string; first_name: string; last_name: string; applicant_ref: string; date_of_birth: string | null; nationality: string | null };
  };

  const [{ data: reviews }, { data: cat }, { data: academic }, { data: staff }] = await Promise.all([
    supabase.from("document_reviews").select("id, from_status, to_status, feedback, created_at, reviewer_id, version_id").eq("document_id", id).order("created_at", { ascending: false }),
    supabase.from("document_categories").select("label, description").eq("code", doc.category).maybeSingle(),
    supabase.from("academic_qualifications").select("qualification_name, institution, country, end_date, grade").eq("student_id", doc.profiles.id),
    supabase.from("staff_roles").select("user_id, profiles!staff_roles_user_id_fkey(first_name, last_name, email)"),
  ]);
  const reviewerName = (uid: string | null) => {
    if (!uid) return "System";
    const p = ((staff ?? []) as unknown as { user_id: string; profiles: { first_name: string; last_name: string; email: string } | null }[]).find((s) => s.user_id === uid)?.profiles;
    return p ? `${p.first_name} ${p.last_name}`.trim() || p.email : "Staff member";
  };
  const versions = doc.document_versions.filter((v) => v.upload_completed).sort((a, b) => b.version_no - a.version_no);
  const current = versions.find((v) => v.id === doc.current_version_id);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={doc.title}
        intro={
          <>
            {cat?.label ?? doc.category} ·{" "}
            <Link href={`/admin/students/${doc.profiles.id}`} className="font-semibold text-navy hover:underline">
              {doc.profiles.first_name} {doc.profiles.last_name} ({doc.profiles.applicant_ref})
            </Link>
          </>
        }
        actions={<StatusBadge status={doc.status} map={documentStatuses} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Card title="Current file">
            {current ? (
              <>
                <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
                  <dt className="text-ink-faint">File</dt><dd className="break-all">{current.file_name}</dd>
                  <dt className="text-ink-faint">Version</dt><dd>{current.version_no}</dd>
                  <dt className="text-ink-faint">Type / size</dt><dd>{current.mime_type} · {formatBytes(current.size_bytes)}</dd>
                  <dt className="text-ink-faint">Uploaded</dt><dd>{formatDate(current.created_at, true)}</dd>
                  <dt className="text-ink-faint">Security</dt><dd>{scanStatuses[current.scan_status as keyof typeof scanStatuses] ?? current.scan_status}</dd>
                </dl>
                {current.scan_status === "not_scanned" && (
                  <Alert tone="warn" className="mt-4">No malware scanner is configured. Open files only on an up-to-date, protected device.</Alert>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`/api/documents/${current.id}?inline=1`} target="_blank" rel="noopener noreferrer" className={buttonClass.navy}>
                    Open <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a href={`/api/documents/${current.id}`} className={buttonClass.secondary}>
                    <Download className="h-4 w-4" aria-hidden="true" /> Download
                  </a>
                </div>
                <p className="mt-2 text-xs text-ink-faint">Links are valid for 60 seconds and each access is recorded in the audit log.</p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">No completed upload.</p>
            )}
            {versions.length > 1 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-semibold text-navy">Earlier versions</summary>
                <ul className="mt-2 grid gap-1">
                  {versions.filter((v) => v.id !== current?.id).map((v) => (
                    <li key={v.id} className="flex justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                      <span>v{v.version_no} · {formatDate(v.created_at, true)}</span>
                      <a href={`/api/documents/${v.id}`} className="font-semibold text-navy hover:underline">Download</a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Card>

          <Card title="Supporting information">
            <p className="text-sm text-ink-muted">Date of birth {formatDate(doc.profiles.date_of_birth)} · Nationality {doc.profiles.nationality ?? "—"}</p>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {(academic ?? []).map((q, i) => (
                <li key={i}>
                  <span className="font-semibold">{q.qualification_name}</span> – {q.institution}, {q.country} · {formatDate(q.end_date)}{q.grade ? ` · ${q.grade}` : ""}
                </li>
              ))}
              {(academic ?? []).length === 0 && <li className="text-ink-muted">No qualifications entered.</li>}
            </ul>
          </Card>

          <Card title="Review history">
            {(reviews ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">No reviews yet.</p>
            ) : (
              <ol className="grid gap-3 text-sm">
                {(reviews ?? []).map((r) => (
                  <li key={r.id} className="border-l-2 border-navy-soft pl-3">
                    <StatusBadge status={r.to_status as DocumentStatus} map={documentStatuses} />
                    <span className="block text-xs text-ink-faint">
                      {formatDate(r.created_at, true)} · {role === "admin" ? reviewerName(r.reviewer_id) : r.reviewer_id ? "Staff" : "System"}
                      {r.version_id && ` · v${versions.find((v) => v.id === r.version_id)?.version_no ?? "?"}`}
                    </span>
                    {r.feedback && <span className="block text-ink-muted">{r.feedback}</span>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Review checklist" description="GlobalPath internal verification policy.">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
              {checklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Card>
          <Card title="Decision">
            {!doc.review_unlocked ? (
              <p className="text-sm text-ink-muted">
                Waiting for payment. This document can be reviewed once the student pays for and submits an application that includes it.
              </p>
            ) : current ? (
              <ActionForm action={reviewDocumentAction} className="grid gap-4">
                <input type="hidden" name="document_id" value={doc.id} />
                <div>
                  <label htmlFor="status" className={labelClass}>Status</label>
                  <select id="status" name="status" required className={inputClass} defaultValue={doc.status === "pending_review" ? "under_review" : ""}>
                    <option value="">Select…</option>
                    {staffDocumentDecisions.map((s) => (
                      <option key={s} value={s}>{documentStatuses[s].label}</option>
                    ))}
                  </select>
                </div>
                <TextAreaField label="Feedback to student" name="feedback" maxLength={2000} placeholder="e.g. Please upload a complete transcript showing all semesters." hint="Required for Correction required and Rejected. The student sees this text." />
                <div>
                  <SubmitButton variant="navy">Save decision</SubmitButton>
                </div>
                <p className="text-xs text-ink-faint">Your name and the time are recorded with this decision.</p>
              </ActionForm>
            ) : (
              <p className="text-sm text-ink-muted">Nothing to review until the upload is complete.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
