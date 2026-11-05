"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileUp, Loader2, UploadCloud } from "lucide-react";
import { beginUploadAction, finalizeUploadAction } from "@/app/portal/actions";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, formatBytes } from "@/lib/portal/constants";
import { supabasePublishableKey } from "@/lib/supabase/config";
import type { DocumentCategory } from "@/lib/portal/types";
import { cn } from "@/lib/cn";
import { Alert, buttonClass, inputClass, labelClass } from "./ui";

type Phase = "idle" | "uploading" | "checking" | "done" | "error";

/** PUT the file straight to private storage via the signed URL, reporting progress. */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("apikey", supabasePublishableKey);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/**
 * Drag-and-drop uploader. Used for new documents (choose category/title)
 * and for replacements (documentId set). Files never pass through the web
 * server; the server checks them after upload before they become visible.
 */
export function Uploader({
  categories,
  documentId,
  applicationId,
  defaultCategory,
  compact = false,
  label,
}: {
  categories?: DocumentCategory[];
  documentId?: string;
  applicationId?: string;
  defaultCategory?: string;
  compact?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const isReplacement = Boolean(documentId);

  function choose(f: File | undefined | null) {
    setError(null);
    setPhase("idle");
    if (!f) return;
    if (!ALLOWED_UPLOAD_TYPES[f.type]) return setError("Choose a PDF, JPG, PNG or WebP file.");
    if (f.size > MAX_UPLOAD_BYTES) return setError(`This file is ${formatBytes(f.size)}. The maximum is 10 MB.`);
    if (f.size === 0) return setError("This file is empty.");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 150));
  }

  async function upload() {
    if (!file) return setError("Choose a file first.");
    if (!isReplacement && !category) return setError("Choose a document category.");
    setError(null);
    setPhase("uploading");
    setProgress(0);
    const begin = await beginUploadAction({ documentId, category, title, applicationId, fileName: file.name, mimeType: file.type, size: file.size });
    if (!begin.ok) {
      setPhase("error");
      return setError(begin.error);
    }
    try {
      await putWithProgress(begin.signedUrl, file, setProgress);
    } catch {
      setPhase("error");
      return setError("The upload was interrupted. Check your connection and try again.");
    }
    setPhase("checking");
    const result = await finalizeUploadAction(begin.versionId);
    if (!result.ok) {
      setPhase("error");
      return setError(result.error ?? "The upload could not be completed.");
    }
    setPhase("done");
    setFile(null);
    setTitle("");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  const busy = phase === "uploading" || phase === "checking";

  return (
    <div className={cn(!compact && "rounded-2xl bg-white p-5 shadow-card ring-1 ring-line md:p-6")}>
      {!compact && <h2 className="font-display text-lg font-semibold text-ink">{label ?? "Upload a document"}</h2>}

      {!isReplacement && categories && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="up-category" className={labelClass}>Document category</label>
            <select id="up-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} disabled={busy}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            {categories.find((c) => c.code === category)?.description && (
              <p className="mt-1 text-sm text-ink-faint">{categories.find((c) => c.code === category)?.description}</p>
            )}
          </div>
          <div>
            <label htmlFor="up-title" className={labelClass}>Title</label>
            <input id="up-title" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BSc certificate – University of Lagos" className={inputClass} disabled={busy} />
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) choose(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition-colors",
          compact ? "py-5" : "py-8",
          dragging ? "border-brandorange bg-gold-soft" : "border-line bg-canvas/60"
        )}
      >
        <UploadCloud className="h-8 w-8 text-navy" aria-hidden="true" />
        <p className="mt-2 text-sm text-ink-muted">
          Drag and drop a file here, or{" "}
          <button type="button" className={buttonClass.link} onClick={() => inputRef.current?.click()} disabled={busy}>
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-ink-faint">PDF, JPG, PNG or WebP · up to 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(ALLOWED_UPLOAD_TYPES).join(",")}
          className="sr-only"
          aria-label={isReplacement ? "Choose replacement file" : "Choose file to upload"}
          onChange={(e) => choose(e.target.files?.[0])}
        />
        {file && (
          <p className="mt-3 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-line">
            <FileUp className="h-4 w-4 text-navy" aria-hidden="true" /> {file.name} · {formatBytes(file.size)}
          </p>
        )}
      </div>

      {phase === "uploading" && (
        <div className="mt-4" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-navy-soft" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-brandorange transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">Uploading… {progress}%</p>
        </div>
      )}
      {phase === "checking" && (
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Running security checks…
        </p>
      )}
      {phase === "done" && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#11643A]" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Uploaded. It is now waiting for GlobalPath review.
        </p>
      )}
      {error && <Alert tone="danger" className="mt-4">{error}</Alert>}

      <button type="button" onClick={upload} disabled={busy || !file} className={cn(buttonClass.primary, "mt-4")}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isReplacement ? "Upload replacement" : "Upload document"}
      </button>
    </div>
  );
}
