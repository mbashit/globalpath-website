import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Paperclip, X } from "lucide-react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/portal/forms";
import { Uploader } from "@/components/portal/Uploader";
import { Alert, Card, Field, PageHeader, StatusBadge, TextAreaField, buttonClass } from "@/components/portal/ui";
import { applicationStatusAction, deleteApplicationAction, payApplicationFeeAction, setAttachmentAction, updateApplicationAction } from "../../actions";
import { requireUser } from "@/lib/portal/auth";
import { isPaystackConfigured } from "@/lib/paystack";
import { applicationFee } from "@/data/site";
import { applicationStatuses, documentStatuses, editableApplicationStatuses, formatDate } from "@/lib/portal/constants";
import { isUuid } from "@/lib/portal/validation";
import type { Application, DocumentCategory, DocumentRow } from "@/lib/portal/types";

export const metadata = { title: "Application" };

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await requireUser(`/portal/applications/${id}`);
  const { notice } = await searchParams;

  const { data: appData } = await supabase.from("applications").select("*").eq("id", id).eq("student_id", user.id).maybeSingle();
  if (!appData) notFound();
  const app = appData as Application;

  const [{ data: links }, { data: docs }, { data: categories }, { data: requirements }, { data: history }, { data: payment }] = await Promise.all([
    supabase.from("application_documents").select("document_id").eq("application_id", id),
    supabase.from("documents").select("*").eq("owner_id", user.id).not("current_version_id", "is", null).order("created_at", { ascending: false }),
    supabase.from("document_categories").select("*").eq("active", true).order("sort_order"),
    app.degree_level ? supabase.from("document_requirements").select("category, required, notes").eq("degree_level", app.degree_level) : Promise.resolve({ data: [] }),
    supabase.from("application_status_history").select("from_status, to_status, note, created_at").eq("application_id", id).order("created_at", { ascending: false }),
    supabase.from("application_payments").select("reference, paid_at").eq("application_id", id).maybeSingle(),
  ]);

  const attachedIds = new Set((links ?? []).map((l) => l.document_id));
  const allDocs = (docs ?? []) as DocumentRow[];
  const attached = allDocs.filter((d) => attachedIds.has(d.id));
  const available = allDocs.filter((d) => !attachedIds.has(d.id) && (d.application_id === null || d.application_id === id));
  const cats = (categories ?? []) as DocumentCategory[];
  const catLabel = (code: string) => cats.find((c) => c.code === code)?.label ?? code;
  const reqs = (requirements ?? []) as { category: string; required: boolean; notes: string | null }[];
  const editable = editableApplicationStatuses.includes(app.status);
  const paid = Boolean(payment);
  const notices: Record<string, { tone: "success" | "info" | "warn" | "danger"; text: string }> = {
    created: { tone: "success", text: `Application created. Attach your documents, then pay the ${applicationFee.label} application fee to submit it to GlobalPath.` },
    "paid-submitted": { tone: "success", text: "Payment received. Your application has been submitted to GlobalPath." },
    paid: { tone: "success", text: "Payment received. Review your application and submit it when it is ready." },
    "payment-failed": { tone: "danger", text: "We could not confirm that payment. If money left your account, message us with your payment reference; otherwise try again." },
    "payment-pending": { tone: "warn", text: "Your payment is still being confirmed. Refresh this page in a minute; contact us if it does not update." },
    "paid-twice": { tone: "warn", text: "This application was already paid for, so your latest payment was recorded separately. GlobalPath will contact you about a refund." },
    "payment-unavailable": { tone: "warn", text: "Online payment is not available right now. Please contact GlobalPath." },
  };
  const shown = notice ? notices[notice] : undefined;

  return (
    <div className="grid gap-6">
      {shown && <Alert tone={shown.tone}>{shown.text}</Alert>}
      <PageHeader
        title={app.programme_snapshot || "Application"}
        intro={
          <>
            Reference <strong className="text-navy">{app.reference}</strong> · created {formatDate(app.created_at)}
          </>
        }
        actions={<StatusBadge status={app.status} map={applicationStatuses} />}
      />

      {app.staff_feedback && ["missing_documents", "correction_required", "under_review", "documents_verified", "review_completed", "closed"].includes(app.status) && (
        <Alert tone={editable ? "warn" : "info"} title="Feedback from GlobalPath">
          <p className="whitespace-pre-line">{app.staff_feedback}</p>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <Card title="Attached documents" description="Reuse documents from your library, or upload a document only for this application (such as a motivation letter).">
            {attached.length === 0 ? (
              <p className="text-sm text-ink-muted">No documents attached yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {attached.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span>
                      <span className="block font-semibold text-ink">{d.title}</span>
                      <span className="text-sm text-ink-muted">{catLabel(d.category)}{d.application_id ? " · only for this application" : " · reusable"}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={d.status} map={documentStatuses} />
                      {editable && (
                        <form action={setAttachmentAction}>
                          <input type="hidden" name="application_id" value={id} />
                          <input type="hidden" name="document_id" value={d.id} />
                          <button type="submit" className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-canvas" aria-label={`Detach ${d.title}`}>
                            <X className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {editable && available.length > 0 && (
              <div className="mt-5 rounded-xl bg-canvas p-4">
                <p className="text-sm font-semibold text-ink">Attach from your document library</p>
                <ul className="mt-2 grid gap-2">
                  {available.map((d) => (
                    <li key={d.id}>
                      <form action={setAttachmentAction} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-line">
                        <input type="hidden" name="application_id" value={id} />
                        <input type="hidden" name="document_id" value={d.id} />
                        <input type="hidden" name="attach" value="1" />
                        <span className="text-sm">
                          <span className="font-medium text-ink">{d.title}</span> <span className="text-ink-faint">· {catLabel(d.category)}</span>
                        </span>
                        <button type="submit" className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
                          <Paperclip className="h-4 w-4" aria-hidden="true" /> Attach
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {editable && (
              <details className="mt-5">
                <summary className="cursor-pointer font-semibold text-navy">Upload a document for this application only</summary>
                <Uploader compact categories={cats.filter((c) => !c.sensitive)} applicationId={id} defaultCategory="motivation_letter" />
              </details>
            )}
          </Card>

          {editable && (
            <Card title="Application details">
              <ActionForm action={updateApplicationAction} className="grid gap-4">
                <input type="hidden" name="id" value={id} />
                <Field label="Intended intake" name="intake" defaultValue={app.intake ?? ""} optional maxLength={100} />
                <TextAreaField label="Notes for your GlobalPath adviser" name="student_notes" defaultValue={app.student_notes ?? ""} optional maxLength={4000} />
                <div>
                  <SubmitButton variant="secondary">Save details</SubmitButton>
                </div>
              </ActionForm>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-6">
          <Card title="Actions">
            <div className="mb-4 rounded-xl bg-canvas p-4 text-sm">
              <p className="font-semibold text-ink">Application fee: {applicationFee.label}</p>
              {paid ? (
                <p className="mt-1 text-ink-muted">
                  Paid{payment?.paid_at ? ` on ${formatDate(payment.paid_at)}` : ""} · ref {payment?.reference}
                </p>
              ) : (
                <p className="mt-1 text-ink-muted">Charged once per application, paid securely with Paystack before it is submitted. Resubmitting after corrections is free.</p>
              )}
            </div>
            <div className="grid gap-3">
              {editable && paid && (
                <ActionForm action={applicationStatusAction}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="intent" value="submit" />
                  <SubmitButton pendingText="Submitting…" className="w-full">
                    {app.status === "draft" ? "Submit to GlobalPath for review" : "Resubmit to GlobalPath"}
                  </SubmitButton>
                </ActionForm>
              )}
              {editable && !paid && (
                isPaystackConfigured ? (
                  <ActionForm action={payApplicationFeeAction}>
                    <input type="hidden" name="id" value={id} />
                    <SubmitButton pendingText="Opening payment…" className="w-full">
                      Pay {applicationFee.label} and submit
                    </SubmitButton>
                  </ActionForm>
                ) : (
                  <Alert tone="warn">Online payment is not available yet. Contact GlobalPath on WhatsApp to pay the application fee.</Alert>
                )
              )}
              {app.status === "submitted" && (
                <ActionForm action={applicationStatusAction}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="intent" value="draft" />
                  <SubmitButton variant="secondary" pendingText="Updating…" className="w-full">Request changes (return to draft)</SubmitButton>
                </ActionForm>
              )}
              {!["closed", "withdrawn"].includes(app.status) && (
                <ActionForm action={applicationStatusAction}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="intent" value="withdraw" />
                  <ConfirmSubmit message="Withdraw this application? GlobalPath will stop preparing it." variant="secondary" className="w-full">
                    Withdraw application
                  </ConfirmSubmit>
                </ActionForm>
              )}
              {app.status === "draft" && !paid && (
                <form action={deleteApplicationAction}>
                  <input type="hidden" name="id" value={id} />
                  <ConfirmSubmit message="Delete this draft? Documents uploaded only for this application are also deleted." className="w-full">
                    Delete draft
                  </ConfirmSubmit>
                </form>
              )}
            </div>
            <p className="mt-4 text-xs text-ink-faint">Submitting sends this record to GlobalPath only. It is not a university or uni-assist application.</p>
          </Card>

          {reqs.length > 0 && (
            <Card title="Document checklist" description="Set by GlobalPath for this degree level. Check the university's official page as well.">
              <ul className="grid gap-2 text-sm">
                {reqs.map((r) => {
                  const done = attached.some((d) => d.category === r.category);
                  return (
                    <li key={r.category} className="flex items-start gap-2">
                      {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1FAF55]" aria-label="Attached" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-label="Not attached" />}
                      <span>
                        <span className="text-ink">{catLabel(r.category)}</span>
                        {!r.required && <span className="text-ink-faint"> (if applicable)</span>}
                        {r.notes && <span className="block text-xs text-ink-faint">{r.notes}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card title="Status history">
            {(history ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">Not submitted yet.</p>
            ) : (
              <ol className="grid gap-3 text-sm">
                {(history ?? []).map((h, i) => (
                  <li key={i} className="border-l-2 border-navy-soft pl-3">
                    <StatusBadge status={h.to_status as Application["status"]} map={applicationStatuses} />
                    <span className="mt-1 block text-xs text-ink-faint">{formatDate(h.created_at, true)}</span>
                    {h.note && <span className="mt-1 block text-ink-muted">{h.note}</span>}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Link href="/portal/applications" className={buttonClass.link}>← All applications</Link>
        </div>
      </div>
    </div>
  );
}
