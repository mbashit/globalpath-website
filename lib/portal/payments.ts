import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VerifiedFeePayment } from "@/lib/paystack";

export type RecordResult = "recorded" | "already-recorded" | "duplicate-payment" | "mismatch";

/**
 * Stores a Paystack-verified application fee. Called from both the webhook
 * and the student's return from checkout, so it is idempotent per Paystack
 * reference. Uses the service role: students can read payments but never
 * write them (see supabase/migrations/*_application_fee.sql).
 */
export async function recordFeePayment(p: VerifiedFeePayment): Promise<RecordResult> {
  const db = createAdminClient();
  const { data: app } = await db.from("applications").select("id, student_id").eq("id", p.metadata.applicationId).maybeSingle();
  if (!app || app.student_id !== p.metadata.studentId) return "mismatch";

  const row = {
    application_id: app.id,
    student_id: app.student_id,
    reference: p.reference,
    amount_minor: p.amountMinor,
    currency: p.currency,
    paid_at: p.paidAt || new Date().toISOString(),
  };
  const { error } = await db.from("application_payments").insert(row);
  if (!error) return "recorded";
  if (error.code !== "23505") throw new Error(`Could not record payment ${p.reference}: ${error.message}`);

  // Unique violation: either this reference is already stored (webhook and
  // return page both ran), or the application was already paid by another
  // checkout. Keep the second payment unlinked so staff can refund it.
  const { data: same } = await db.from("application_payments").select("id").eq("reference", p.reference).maybeSingle();
  if (same) return "already-recorded";
  await db.from("application_payments").insert({ ...row, application_id: null });
  console.error(`Application ${app.id} was paid twice; payment ${p.reference} stored unlinked for refund.`);
  return "duplicate-payment";
}
