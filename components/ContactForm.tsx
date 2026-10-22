"use client";

import Link from "next/link";
import { startTransition, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Paperclip } from "lucide-react";
import type { Field } from "@/data/forms";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "success" | "error";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRe = /^\+?[0-9\s().-]{7,20}$/;

function validate(field: Field, value: string): string | null {
  const v = value.trim();
  if (field.required && !v) return `Enter your ${field.label.toLowerCase()}`;
  if (!v) return null;
  if (field.type === "email" && !emailRe.test(v)) return "Enter a valid email address, like name@example.com";
  if (field.type === "tel" && (!phoneRe.test(v) || v.replace(/\D/g, "").length < 7))
    return "Enter a phone number with country code, like +234 800 000 0000";
  if (field.type === "number") {
    const n = Number(v);
    if (Number.isNaN(n)) return "Enter a number";
    if (field.min !== undefined && n < field.min) return `Enter a number of at least ${field.min}`;
  }
  if (field.type === "date" && field.name === "preferredDate") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(v) < today) return "Choose today or a future date";
  }
  return null;
}

export function ContactForm({
  fields,
  formType,
  submitLabel,
  successTitle = "Request sent",
  successText = "Thank you. Our team will contact you, usually by WhatsApp, to confirm the next steps.",
  showUpload = false,
}: {
  fields: Field[];
  formType: string;
  submitLabel: string;
  successTitle?: string;
  successText?: string;
  showUpload?: boolean;
}) {
  const uid = useId();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, ""])));
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Prefill from the URL, e.g. /book-consultation?service=visa or ?destination=Germany
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    startTransition(() => {
      setValues((prev) => {
        const next = { ...prev };
        fields.forEach((f) => {
          const p = params.get(f.name);
          if (p && (!f.options || f.options.some((o) => o.value === p))) next[f.name] = p;
        });
        return next;
      });
    });
  }, [fields]);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors: Record<string, string | null> = {};
    fields.forEach((f) => (nextErrors[f.name] = validate(f, values[f.name] ?? "")));
    setErrors(nextErrors);
    setConsentError(!consent);
    const firstBad = fields.find((f) => nextErrors[f.name]);
    if (firstBad || !consent) {
      const id = firstBad ? `${uid}-${firstBad.name}` : `${uid}-consent`;
      document.getElementById(id)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const honeypot = (formRef.current?.elements.namedItem("company_website") as HTMLInputElement | null)?.value ?? "";
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          data: values,
          // Only file NAMES are sent – never file contents. See note below.
          attachmentsListed: fileNames,
          company_website: honeypot,
          page: window.location.pathname,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
    setTimeout(() => statusRef.current?.focus(), 50);
  }

  if (status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} className="rounded-2xl border border-[#1FAF55]/30 bg-[#EFFAF3] p-8 text-center outline-none" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#1FAF55]" aria-hidden="true" />
        <h3 className="mt-4 font-display text-2xl font-bold text-ink">{successTitle}</h3>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">{successText}</p>
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-[#1FAF55] px-6 font-semibold text-white hover:bg-[#178a43]">
          Message us on WhatsApp now
        </a>
      </div>
    );
  }

  const inputCls = (bad: boolean) =>
    cn(
      "mt-1.5 block w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-4",
      bad ? "border-[#C8341B] focus:ring-[#C8341B]/15" : "border-line focus:border-navy focus:ring-navy/10"
    );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {/* Honeypot: hidden from people, catches basic spam bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {fields.map((f) => {
        const id = `${uid}-${f.name}`;
        const err = errors[f.name];
        const describedBy = [f.hint && `${id}-hint`, err && `${id}-err`].filter(Boolean).join(" ") || undefined;
        const common = {
          id,
          name: f.name,
          value: values[f.name] ?? "",
          required: f.required,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": describedBy,
          onBlur: () => setErrors((e) => ({ ...e, [f.name]: validate(f, values[f.name] ?? "") })),
        };
        return (
          <div key={f.name} className={f.half ? "sm:col-span-1" : "sm:col-span-2"}>
            <label htmlFor={id} className="text-sm font-semibold text-ink">
              {f.label}
              {f.required ? <span className="text-[#C8341B]" aria-hidden="true"> *</span> : <span className="font-normal text-ink-faint"> (optional)</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea {...common} rows={5} placeholder={f.placeholder} className={inputCls(!!err)} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === "select" ? (
              <div className="relative">
                <select {...common} className={cn(inputCls(!!err), "appearance-none pr-11")} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">Select…</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-[3px] h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              </div>
            ) : (
              <input
                {...common}
                type={f.type}
                min={f.min}
                inputMode={f.type === "tel" ? "tel" : f.type === "number" ? "numeric" : undefined}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                className={inputCls(!!err)}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
            {f.hint && !err && <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-faint">{f.hint}</p>}
            {err && <p id={`${id}-err`} className="mt-1.5 text-sm font-medium text-[#C8341B]">{err}</p>}
          </div>
        );
      })}

      {showUpload && (
        <div className="sm:col-span-2">
          {/*
            ================================================================
            SECURE UPLOAD NEEDED BEFORE ACCEPTING FILES
            This input only lists file NAMES so the team knows what to expect.
            File contents are NOT uploaded anywhere. Before accepting real
            documents (passports, certificates, police reports) you need:
              - an authenticated backend endpoint (e.g. /api/upload)
              - encrypted private storage (e.g. S3 / Cloudflare R2 private bucket
                with signed upload URLs), never a public folder
              - file type + size checks and virus scanning
              - an automatic deletion/retention policy matching the Privacy Policy
            Until then, documents are collected through a secure channel
            agreed with the client after first contact.
            ================================================================
          */}
          <label htmlFor={`${uid}-files`} className="text-sm font-semibold text-ink">
            Documents to translate <span className="font-normal text-ink-faint">(optional, file names only)</span>
          </label>
          <label
            htmlFor={`${uid}-files`}
            className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line bg-canvas px-4 py-6 text-center text-ink-muted hover:border-navy/40"
          >
            <Paperclip className="h-6 w-6 text-navy" aria-hidden="true" />
            <span>Choose files so we can see what you need translated</span>
            <span className="text-sm text-ink-faint">We only record file names here. We will send you a secure way to share the documents themselves.</span>
          </label>
          <input
            id={`${uid}-files`}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
          />
          {fileNames.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {fileNames.map((n) => (
                <li key={n} className="rounded-full bg-navy-soft px-3 py-1 text-navy">{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-[0.95rem] text-ink-muted">
          <input
            id={`${uid}-consent`}
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setConsentError(false);
            }}
            aria-invalid={consentError || undefined}
            aria-describedby={consentError ? `${uid}-consent-err` : undefined}
            className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-[#252B83]"
          />
          <span>
            I agree to be contacted about my enquiry and I have read the{" "}
            <Link href="/privacy-policy" className="font-semibold text-navy underline underline-offset-2">Privacy Policy</Link>.
          </span>
        </label>
        {consentError && <p id={`${uid}-consent-err`} className="mt-1.5 text-sm font-medium text-[#C8341B]">Tick the box so we can contact you</p>}
      </div>

      {status === "error" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="rounded-xl border border-[#C8341B]/30 bg-[#FFF1EC] p-4 text-[0.95rem] text-[#7A2410] outline-none sm:col-span-2">
          Your request could not be sent. Check your connection and try again, or{" "}
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-semibold underline">send us the details on WhatsApp</a>.
        </div>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brandorange px-8 font-semibold text-navy-ink transition-colors hover:bg-gold disabled:opacity-70 sm:w-auto"
        >
          {status === "submitting" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {status === "submitting" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
