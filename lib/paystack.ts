import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { applicationFee, siteConfig } from "@/data/site";

/**
 * Paystack helpers for the eligibility-review application fee.
 *
 * Flow: /api/contact starts a hosted Paystack checkout and the browser is
 * sent there. Paystack then calls /api/payments/paystack/webhook, which
 * re-verifies the charge and only then forwards the request to
 * FORM_FORWARD_URL. The callback page only shows the student the status.
 *
 * PAYSTACK_SECRET_KEY is SERVER ONLY. USD must be enabled on the Paystack
 * account, otherwise initialisation fails and the form shows an error.
 */

const API = "https://api.paystack.co";
const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";

export const isPaystackConfigured = Boolean(secretKey);

/** Smallest currency unit (cents), as Paystack expects. */
export const feeSubunits = Math.round(applicationFee.amount * 100);

export type FeeMetadata = {
  formType: string;
  page: string;
  submittedAt: string;
  fields: Record<string, string>;
};

export type VerifiedPayment = {
  reference: string;
  paidAt: string;
  amount: number;
  currency: string;
  metadata: FeeMetadata;
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

/** Starts a checkout and returns the hosted payment page URL. */
export async function initializeFeePayment(email: string, metadata: FeeMetadata): Promise<string> {
  const data = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: feeSubunits,
      currency: applicationFee.currency,
      callback_url: `${siteConfig.url}/study-abroad/payment`,
      metadata,
    }),
  });
  if (typeof data.authorization_url !== "string") throw new Error("Paystack returned no checkout URL");
  return data.authorization_url;
}

/** Looks the reference up with Paystack; null unless it is a successful, full-price fee payment. */
export async function verifyFeePayment(reference: string): Promise<VerifiedPayment | null> {
  if (!/^[A-Za-z0-9._=-]{1,100}$/.test(reference)) return null;
  const data = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  const metadata = data.metadata as FeeMetadata | undefined;
  if (
    data.status !== "success" ||
    data.amount !== feeSubunits ||
    data.currency !== applicationFee.currency ||
    !metadata?.fields ||
    typeof metadata.formType !== "string"
  ) {
    return null;
  }
  return {
    reference,
    paidAt: String(data.paid_at ?? ""),
    amount: applicationFee.amount,
    currency: applicationFee.currency,
    metadata,
  };
}

/** Checks the x-paystack-signature header (HMAC-SHA512 of the raw body). */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!secretKey || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", secretKey).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
