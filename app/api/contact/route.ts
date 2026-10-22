import { NextResponse } from "next/server";

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

const MAX_FIELD = 3000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { formType, data, attachmentsListed, company_website, page } = (body ?? {}) as {
    formType?: string;
    data?: Record<string, unknown>;
    attachmentsListed?: unknown;
    company_website?: string;
    page?: string;
  };

  // Honeypot: pretend success for bots
  if (company_website) return NextResponse.json({ ok: true });

  if (!formType || typeof data !== "object" || data === null) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  // Basic server-side sanitising
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string") clean[k.slice(0, 60)] = v.slice(0, MAX_FIELD).trim();
  }
  const email = clean.email ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const payload = {
    formType: String(formType).slice(0, 40),
    page: typeof page === "string" ? page.slice(0, 200) : "",
    submittedAt: new Date().toISOString(),
    fields: clean,
    attachmentsListed: Array.isArray(attachmentsListed) ? attachmentsListed.slice(0, 20).map((x) => String(x).slice(0, 200)) : [],
  };

  const forwardUrl = process.env.FORM_FORWARD_URL;
  if (!forwardUrl) {
    if (process.env.NODE_ENV === "production") {
      console.error("FORM_FORWARD_URL is not set – submission not delivered.");
      return NextResponse.json({ ok: false, error: "Form delivery not configured" }, { status: 503 });
    }
    console.info("[dev] Form submission:", payload);
    return NextResponse.json({ ok: true, dev: true });
  }

  try {
    const res = await fetch(forwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Forward failed: ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Delivery failed" }, { status: 502 });
  }
}
