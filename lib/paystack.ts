import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { applicationFee } from "@/data/site";

/**
 * Paystack helpers for the per-application fee (see lib/portal/payments.ts).
 *
 * PAYSTACK_SECRET_KEY is SERVER ONLY. USD must be enabled on the Paystack
 * account, otherwise initialisation fails and the student sees an error.
 */

const API = "https://api.paystack.co";
const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";

export const isPaystackConfigured = Boolean(secretKey);

/** Smallest currency unit (cents), as Paystack expects. */
export const feeSubunits = Math.round(applicationFee.amount * 100);

export type ApplicationFeeMetadata = { kind: "application_fee"; applicationId: string; studentId: string };

export type VerifiedFeePayment = {
  reference: string;
  paidAt: string;
  amountMinor: number;
  currency: string;
  metadata: ApplicationFeeMetadata;
};

async function paystack(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { status?: boolean; data?: Record<string, unknown> } | null;
  if (!res.ok || !json?.status || !json.data) throw new Error(`Paystack ${path} failed (${res.status})`);
  return json.data;
}

/** Starts a checkout for one application's fee and returns the hosted payment page URL. */
export async function initializeFeePayment(email: string, callbackUrl: string, metadata: ApplicationFeeMetadata): Promise<string> {
  const data = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email, amount: feeSubunits, currency: applicationFee.currency, callback_url: callbackUrl, metadata }),
  });
  if (typeof data.authorization_url !== "string") throw new Error("Paystack returned no checkout URL");
  return data.authorization_url;
}

export const isValidReference = (reference: string) => /^[A-Za-z0-9._=-]{1,100}$/.test(reference);

/** Looks the reference up with Paystack; null unless it is a successful, full-price application-fee payment. */
export async function verifyFeePayment(reference: string): Promise<VerifiedFeePayment | null> {
  if (!isValidReference(reference)) return null;
  const data = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  const metadata = data.metadata as Partial<ApplicationFeeMetadata> | undefined;
  if (
    data.status !== "success" ||
    data.amount !== feeSubunits ||
    data.currency !== applicationFee.currency ||
    metadata?.kind !== "application_fee" ||
    typeof metadata.applicationId !== "string" ||
    typeof metadata.studentId !== "string"
  ) {
    return null;
  }
  return {
    reference,
    paidAt: String(data.paid_at ?? ""),
    amountMinor: feeSubunits,
    currency: applicationFee.currency,
    metadata: metadata as ApplicationFeeMetadata,
  };
}

/** Checks the x-paystack-signature header (HMAC-SHA512 of the raw body). */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!secretKey || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", secretKey).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
