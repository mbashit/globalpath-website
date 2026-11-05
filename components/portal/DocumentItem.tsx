import { Download, Eye, FileText, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "./forms";
import { Uploader } from "./Uploader";
import { Alert, StatusBadge } from "./ui";
import { deleteDocumentAction } from "@/app/portal/actions";
import { documentStatuses, formatBytes, formatDate } from "@/lib/portal/constants";
import type { DocumentRow, DocumentVersion } from "@/lib/portal/types";

/** One document in the student's library: preview, versions, replace, delete. */
export function DocumentItem({
  doc,
  versions,
  categoryLabel,
  usedIn,
}: {
  doc: DocumentRow;
  versions: DocumentVersion[];
  categoryLabel: string;
  usedIn: string[];
}) {
  const completed = versions.filter((v) => v.upload_completed).sort((a, b) => b.version_no - a.version_no);
  const current = completed.find((v) => v.id === doc.current_version_id);
  const canReplace = doc.status !== "under_review";
  const needsAction = doc.status === "correction_required" || doc.status === "rejected";

  return (
    <li className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-canvas ring-1 ring-line">
          {current && current.mime_type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL via authorised redirect
            <img src={`/api/documents/${current.id}?inline=1`} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <FileText className="h-8 w-8 text-navy" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink">{doc.title}</h3>
              <p className="text-sm text-ink-muted">
                {categoryLabel}
                {doc.application_id ? " · application-specific" : " · reusable"}
              </p>
            </div>
            <StatusBadge status={doc.status} map={documentStatuses} />
          </div>
          {current ? (
            <p className="mt-1 text-sm text-ink-faint">
              Version {current.version_no} · {current.file_name} · {formatBytes(current.size_bytes)} · uploaded {formatDate(current.created_at, true)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[#9A2E14]">Upload not finished. Upload the file again or delete this entry.</p>
          )}
          {usedIn.length > 0 && <p className="mt-1 text-xs text-ink-faint">Attached to: {usedIn.join(", ")}</p>}

          {needsAction && doc.latest_feedback && (
            <Alert tone="warn" title="Reviewer feedback" className="mt-3">
              {doc.latest_feedback}
            </Alert>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            {current && (
              <>
                <a href={`/api/documents/${current.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy hover:underline">
                  <Eye className="h-4 w-4" aria-hidden="true" /> Preview
                </a>
                <a href={`/api/documents/${current.id}`} className="inline-flex items-center gap-1 text-navy hover:underline">
                  <Download className="h-4 w-4" aria-hidden="true" /> Download
                </a>
              </>
            )}
          </div>

          {completed.length > 1 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-navy">Version history ({completed.length})</summary>
              <ul className="mt-2 grid gap-1">
                {completed.map((v) => (
                  <li key={v.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                    <span>
                      v{v.version_no} · {v.file_name} · {formatDate(v.created_at, true)}
                      {v.id === doc.current_version_id && <span className="ml-1 font-semibold text-navy">(current)</span>}
                    </span>
                    <a href={`/api/documents/${v.id}`} className="font-semibold text-navy hover:underline">Download</a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {(canReplace || !current) && (
            <details className="mt-3" open={needsAction}>
              <summary className="cursor-pointer text-sm font-semibold text-navy">{needsAction ? "Replace document" : "Upload a new version"}</summary>
              <Uploader compact documentId={doc.id} />
            </details>
          )}
          {doc.status === "under_review" && <p className="mt-3 text-sm text-ink-faint">This document is being reviewed. You can replace it after the review.</p>}

          {doc.status !== "under_review" && (
            <form action={deleteDocumentAction} className="mt-3">
              <input type="hidden" name="id" value={doc.id} />
              <ConfirmSubmit message={`Delete "${doc.title}" and all its versions? This cannot be undone.`} variant="link" className="inline-flex items-center gap-1 text-sm text-[#9A2E14] no-underline">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
              </ConfirmSubmit>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
