import { NextResponse } from "next/server";
import { contactFields, consultationFields, documentFields, eligibilityFields, financialReviewFields } from "@/data/forms";
import type { Field } from "@/data/forms";
import { createClient } from "@/lib/supabase/server";
import { isPortalConfigured } from "@/lib/supabase/config";

/**
 * Form endpoint used by every form on the site.
 *
 * DELIVERY: set FORM_FORWARD_URL in your environment (Formspree, Make.com,
 * Zapier webhook or your own CRM). The JSON body is forwarded there.
 * In production without FORM_FORWARD_URL the endpoint returns 503, so the
 * form shows an error with a WhatsApp fallback instead of silently losing leads.
 *
 * This endpoint never receives document files – only form fields.
 * Add rate limiting (e.g. Vercel KV / Upstash) before a marketing launch.
 */

const MAX_REQUEST_BYTES = 16_384;
const MAX_FIELD_LENGTH = 1_500;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_COUNT = 5;
const requestsByIp = new Map<string, { count: number; resetAt: number }>();

const formSchemas: Record<string, Field[]> = {
  contact: contactFields,
  consultation: consultationFields,
  "eligibility-review": eligibilityFields,
  "financial-review": financialReviewFields,
  "document-quote": documentFields,
};

function clientIp(request: Request): string | null {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.slice(0, 64);
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim().slice(0, 64) || null;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [key, entry] of requestsByIp) {
    if (entry.resetAt <= now) requestsByIp.delete(key);
  }
  const entry = requestsByIp.get(ip);
  if (!entry || entry.resetAt <= now) {
    requestsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_COUNT;
}

async function readLimitedBody(request: Request): Promise<string | null> {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_REQUEST_BYTES) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function validateData(fields: Field[], data: Record<string, unknown>): Record<string, string> | null {
  const allowedNames = new Set(fields.map((field) => field.name));
  if (Object.keys(data).some((name) => !allowedNames.has(name))) return null;

  const clean: Record<string, string> = {};
  for (const field of fields) {
    const value = data[field.name];
    if (value === undefined) {
      clean[field.name] = "";
      continue;
    }
    if (typeof value !== "string" || value.length > MAX_FIELD_LENGTH) return null;
    const trimmed = value.trim();
    if (field.required && !trimmed) return null;
    if (field.type === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return null;
    if (field.type === "tel" && trimmed && (!/^\+?[0-9\s().-]{7,20}$/.test(trimmed) || trimmed.replace(/\D/g, "").length < 7)) return null;
    if (field.type === "select" && trimmed && !field.options?.some((option) => option.value === trimmed)) return null;
    if (field.type === "number" && trimmed) {
      const number = Number(trimmed);
      if (!Number.isFinite(number) || (field.min !== undefined && number < field.min)) return null;
    }
    if (field.type === "date" && trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    clean[field.name] = trimmed;
  }
  return clean;
}

/**
 * Student portal: if the person submitting is signed in, keep a copy of the
 * consultation request in their own account. Visitors are unaffected, and
 * requests are never linked to an account by matching email addresses.
 */
async function recordForSignedInStudent(fields: Record<string, string>) {
  if (!isPortalConfigured) return;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email_confirmed_at) return;
    await supabase.from("consultation_requests").insert({
      service: fields.service,
      destination: fields.destination || null,
      preferred_date: fields.preferredDate || null,
      message: fields.message || null,
    });
  } catch {
    console.error("Consultation request could not be added to the student portal");
  }
}

export async function POST(req: Request) {
  if (req.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return NextResponse.json({ ok: false, error: "JSON required" }, { status: 415 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(req.url).origin) {
        return NextResponse.json({ ok: false, error: "Cross-origin request blocked" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
    }
  }

  const ip = clientIp(req);
  if (ip && isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": "600" } });
  }

  let rawBody: string | null;
  try {
    rawBody = await readLimitedBody(req);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (rawBody === null) return NextResponse.json({ ok: false, error: "Request is too large" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { formType, data, company_website, page, consent } = (body ?? {}) as {
    formType?: string;
    data?: Record<string, unknown>;
    company_website?: string;
    page?: string;
    consent?: boolean;
  };

  // Honeypot: pretend success for bots
  if (company_website) return NextResponse.json({ ok: true });
  if (consent !== true) return NextResponse.json({ ok: false, error: "Contact consent is required" }, { status: 400 });

  if (typeof formType !== "string" || !formSchemas[formType] || typeof data !== "object" || data === null || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const clean = validateData(formSchemas[formType], data as Record<string, unknown>);
  if (!clean) return NextResponse.json({ ok: false, error: "Check the required fields and try again" }, { status: 400 });

  const payload = {
    formType,
    page: typeof page === "string" ? page.slice(0, 200) : "",
    submittedAt: new Date().toISOString(),
    fields: clean,
  };

  const forwardUrl = process.env.FORM_FORWARD_URL;
  if (!forwardUrl) {
    console.error("FORM_FORWARD_URL is not set; submission was not delivered.");
    return NextResponse.json({ ok: false, error: "Form delivery not configured" }, { status: 503 });
  }

  let target: URL;
  try {
    target = new URL(forwardUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "Form delivery is not configured correctly" }, { status: 503 });
  }
  if (target.protocol !== "https:" || target.username || target.password) {
    return NextResponse.json({ ok: false, error: "Form delivery is not configured correctly" }, { status: 503 });
  }

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error("Form forward failed");
    if (formType === "consultation") await recordForSignedInStudent(clean);
    return NextResponse.json({ ok: true });
  } catch {
    console.error("Form delivery failed");
    return NextResponse.json({ ok: false, error: "Delivery failed" }, { status: 502 });
  }
}
