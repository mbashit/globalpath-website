import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Alert, Card, PageHeader, SelectField, StatusBadge, TextAreaField } from "@/components/portal/ui";
import { setApplicationStatusAction } from "../../actions";
import { requireStaff } from "@/lib/portal/auth";
import { applicationStatuses, documentStatuses, formatDate, staffApplicationStatuses, type ApplicationStatus } from "@/lib/portal/constants";
import { isUuid } from "@/lib/portal/validation";
import type { Application, DocumentRow } from "@/lib/portal/types";

export const metadata = { title: "Application review" };

export default async function AdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireStaff(`/admin/applications/${id}`);
  const { data } = await supabase
    .from("applications")
    .select("*, profiles!applications_student_id_fkey(id, first_name, last_name, applicant_ref)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const app = data as Application & { profiles: { id: string; first_name: string; last_name: string; applicant_ref: string } };

  const [{ data: links }, { data: history }, { data: reqs }, { data: cats }] = await Promise.all([
    supabase.from("application_documents").select("documents(*)").eq("application_id", id),
    supabase.from("application_status_history").select("from_status, to_status, note, created_at, changed_by").eq("application_id", id).order("created_at", { ascending: false }),
    app.degree_level ? supabase.from("document_requirements").select("category, required").eq("degree_level", app.degree_level) : Promise.resolve({ data: [] }),
    supabase.from("document_categories").select("code, label"),
  ]);
  const docs = ((links ?? []) as unknown as { documents: DocumentRow }[]).map((l) => l.documents).filter(Boolean);
  const label = (code: string) => (cats ?? []).find((c) => c.code === code)?.label ?? code;
  const missing = ((reqs ?? []) as { category: string; required: boolean }[]).filter((r) => r.required && !docs.some((d) => d.category === r.category));
  const canChange = !["draft", "withdrawn"].includes(app.status);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={app.programme_snapshot || app.reference}
        intro={
          <>
            {app.reference} ·{" "}
            <Link href={`/admin/students/${app.profiles.id}`} className="font-semibold text-navy hover:underline">
              {app.profiles.first_name} {app.profiles.last_name} ({app.profiles.applicant_ref})
            </Link>
          </>
        }
        actions={<StatusBadge status={app.status} map={applicationStatuses} />}
      />
      <Alert tone="info">This is GlobalPath&apos;s internal review. Do not record university decisions here unless GlobalPath has written confirmation from the institution.</Alert>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Card title="Student notes">
            <p className="whitespace-pre-line text-sm text-ink">{app.student_notes || "—"}</p>
            <p className="mt-2 text-sm text-ink-muted">Intake: {app.intake || "—"} · Submitted {formatDate(app.submitted_at, true)}</p>
          </Card>
          <Card title="Attached documents">
            {missing.length > 0 && (
              <Alert tone="warn" className="mb-4">Missing required: {missing.map((m) => label(m.category)).join(", ")}</Alert>
            )}
            {docs.length === 0 ? (
              <p className="text-sm text-ink-muted">No documents attached.</p>
            ) : (
              <ul className="divide-y divide-line">
                {docs.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span>
                      <Link href={`/admin/documents/${d.id}`} className="font-semibold text-navy hover:underline">{d.title}</Link>
                      <span className="block text-ink-muted">{label(d.category)}</span>
                    </span>
                    <StatusBadge status={d.status} map={documentStatuses} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Update status">
            {canChange ? (
              <ActionForm action={setApplicationStatusAction} className="grid gap-4">
                <input type="hidden" name="application_id" value={id} />
                <SelectField
                  label="New status"
                  name="status"
                  required
                  options={staffApplicationStatuses.map((s) => ({ value: s, label: applicationStatuses[s].label }))}
                />
                <TextAreaField label="Feedback to student" name="note" maxLength={4000} hint="Required for Missing documents and Correction required. Shown to the student." />
                <div>
                  <SubmitButton variant="navy">Save status</SubmitButton>
                </div>
              </ActionForm>
            ) : (
              <p className="text-sm text-ink-muted">The student has not submitted this application or has withdrawn it.</p>
            )}
          </Card>
          <Card title="History">
            <ol className="grid gap-3 text-sm">
              {(history ?? []).map((h, i) => (
                <li key={i} className="border-l-2 border-navy-soft pl-3">
                  <StatusBadge status={h.to_status as ApplicationStatus} map={applicationStatuses} />
                  <span className="block text-xs text-ink-faint">
                    {formatDate(h.created_at, true)} · {h.changed_by === app.profiles.id ? "student" : "staff"}
                  </span>
                  {h.note && <span className="block text-ink-muted">{h.note}</span>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
