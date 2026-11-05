import { NextResponse } from "next/server";
import { isValidWebhookSignature, verifyFeePayment } from "@/lib/paystack";

/**
 * Paystack webhook. Set this URL in Paystack → Settings → API Keys & Webhooks:
 *   https://<your-domain>/api/payments/paystack/webhook
 *
 * On a signed charge.success event the charge is re-verified with Paystack,
 * then the paid eligibility review is forwarded to FORM_FORWARD_URL with the
 * payment reference. A non-200 reply makes Paystack retry, so a failed
 * forward is not lost. The reference lets the inbox spot rare duplicates.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!isValidWebhookSignature(rawBody, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (event.event !== "charge.success" || typeof event.data?.reference !== "string") {
    return NextResponse.json({ ok: true });
  }

  let payment;
  try {
    payment = await verifyFeePayment(event.data.reference);
  } catch (error) {
    console.error("Paystack verification failed", error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  // Not an application-fee charge (or not paid in full): acknowledge and ignore.
  if (!payment) return NextResponse.json({ ok: true });

  const forwardUrl = process.env.FORM_FORWARD_URL;
  let target: URL;
  try {
    target = new URL(forwardUrl ?? "");
    if (target.protocol !== "https:" || target.username || target.password) throw new Error("Unsafe URL");
  } catch {
    console.error("FORM_FORWARD_URL is missing or invalid; paid eligibility review was not delivered.");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...payment.metadata,
        payment: { provider: "paystack", reference: payment.reference, amount: payment.amount, currency: payment.currency, paidAt: payment.paidAt },
      }),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error("Form forward failed");
    return NextResponse.json({ ok: true });
  } catch {
    console.error("Paid eligibility review delivery failed");
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
