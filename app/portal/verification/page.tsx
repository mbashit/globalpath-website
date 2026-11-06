import Link from "next/link";
import { Uploader } from "@/components/portal/Uploader";
import { Alert, Card, EmptyState, PageHeader, StatusBadge, TableWrap, buttonClass, tdClass, thClass } from "@/components/portal/ui";
import { requireUser } from "@/lib/portal/auth";
import { applicationFee } from "@/data/site";
import { documentStatuses, formatDate, type DocumentStatus } from "@/lib/portal/constants";
import type { DocumentRow } from "@/lib/portal/types";

export const metadata = { title: "Document Verification" };

type Review = { document_id: string; to_status: DocumentStatus; feedback: string | null; created_at: string; reviewer_id: string | null };

export default async function VerificationPage() {
  const { supabase, user } = await requireUser("/portal/verification");
  const [{ data: docs }, { data: reviews }, { data: categories }] = await Promise.all([
    supabase.from("documents").select("*, review_unlocked").eq("owner_id", user.id).not("current_version_id", "is", null).order("updated_at", { ascending: false }),
    supabase.from("document_reviews").select("document_id, to_status, feedback, created_at, reviewer_id").order("created_at", { ascending: false }).limit(200),
    supabase.from("document_categories").select("code, label"),
  ]);
  const list = (docs ?? []) as (DocumentRow & { review_unlocked: boolean })[];
  const history = (reviews ?? []) as Review[];
  const label = (code: string) => (categories ?? []).find((c) => c.code === code)?.label ?? code;
  const attention = list.filter((d) => d.status === "correction_required" || d.status === "rejected");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Document verification"
        intro={`Follow GlobalPath's internal review of your documents. Uploading is free; our team reviews a document once you pay for (${applicationFee.label} per application) and submit an application that includes it.`}
      />
      <Alert tone="info">
        &ldquo;Verified&rdquo; means GlobalPath&apos;s team checked the document for completeness and legibility under its internal review policy. It is not certification or recognition by uni-assist, a university or a government authority.
      </Alert>

      {attention.length > 0 && (
        <Card title="Action needed" description="Read the feedback and upload a replacement. Verification restarts automatically.">
          <ul className="grid gap-4">
            {attention.map((d) => (
              <li key={d.id} className="rounded-xl bg-gold-soft/60 p-4 ring-1 ring-gold/50">
                <dl className="grid gap-1 text-sm sm:grid-cols-[140px_1fr]">
                  <dt className="font-semibold text-ink">Document</dt>
                  <dd className="text-ink">{d.title} <span className="text-ink-muted">({label(d.category)})</span></dd>
                  <dt className="font-semibold text-ink">Status</dt>
                  <dd><StatusBadge status={d.status} map={documentStatuses} /></dd>
                  <dt className="font-semibold text-ink">Reviewer feedback</dt>
                  <dd className="whitespace-pre-line text-ink">{d.latest_feedback ?? "—"}</dd>
                </dl>
                <details className="mt-3" open>
                  <summary className="cursor-pointer text-sm font-semibold text-navy">Replace document</summary>
                  <Uploader compact documentId={d.id} />
                </details>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="All documents">
        {list.length === 0 ? (
          <EmptyState title="Nothing to verify yet" action={<Link href="/portal/documents" className={buttonClass.primary}>Upload documents</Link>} />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Document</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Latest review</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => {
                  const steps = history.filter((h) => h.document_id === d.id);
                  return (
                    <tr key={d.id}>
                      <td className={tdClass}>
                        <span className="font-semibold">{d.title}</span>
                        <span className="block text-xs text-ink-faint">{label(d.category)}</span>
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={d.status} map={documentStatuses} />
                        {d.status === "pending_review" && !d.review_unlocked && (
                          <span className="mt-1 block text-xs text-ink-faint">Reviewed after you submit a paid application that includes it</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        {steps.length === 0 ? (
                          "—"
                        ) : (
                          <details>
                            <summary className="cursor-pointer">
                              {formatDate(steps[0].created_at, true)}
                              {steps[0].reviewer_id ? " · GlobalPath reviewer" : ""}
                            </summary>
                            <ol className="mt-2 grid gap-2">
                              {steps.map((s, i) => (
                                <li key={i} className="border-l-2 border-navy-soft pl-3">
                                  <StatusBadge status={s.to_status} map={documentStatuses} />
                                  <span className="block text-xs text-ink-faint">{formatDate(s.created_at, true)}</span>
                                  {s.feedback && <span className="block text-ink-muted">{s.feedback}</span>}
                                </li>
                              ))}
                            </ol>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
