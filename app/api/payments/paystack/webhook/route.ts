import { NextResponse } from "next/server";
import { isValidWebhookSignature, verifyFeePayment } from "@/lib/paystack";
import { recordFeePayment } from "@/lib/portal/payments";

/**
 * Paystack webhook. Set this URL in Paystack → Settings → API Keys & Webhooks:
 *   https://<your-domain>/api/payments/paystack/webhook
 *
 * On a signed charge.success event the charge is re-verified with Paystack
 * and the application fee is recorded, so an application is marked paid even
 * if the student closes the browser before returning from checkout. A
 * non-200 reply makes Paystack retry.
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

  try {
    const payment = await verifyFeePayment(event.data.reference);
    // Not an application-fee charge (or not paid in full): acknowledge and ignore.
    if (!payment) return NextResponse.json({ ok: true });
    const result = await recordFeePayment(payment);
    if (result === "mismatch") console.error(`Paystack payment ${payment.reference} does not match its application`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
