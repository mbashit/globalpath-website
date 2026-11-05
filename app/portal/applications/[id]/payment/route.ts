import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalConfigured } from "@/lib/supabase/config";
import { isPaystackConfigured, isValidReference, verifyFeePayment } from "@/lib/paystack";
import { recordFeePayment } from "@/lib/portal/payments";
import { isUuid } from "@/lib/portal/validation";

/**
 * Paystack sends the student here after checkout (?reference=…). The charge
 * is verified with Paystack (never trusted from the URL), recorded, and the
 * application is then submitted as the signed-in student. If submission is
 * not possible yet, the student lands on the page with the fee marked paid.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const back = (notice: string) => NextResponse.redirect(new URL(`/portal/applications/${id}?notice=${notice}`, request.nextUrl.origin));
  if (!isUuid(id)) return NextResponse.redirect(new URL("/portal/applications", request.nextUrl.origin));
  if (!isPortalConfigured || !isPaystackConfigured) return back("payment-unavailable");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const next = `/portal/applications/${id}/payment${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.nextUrl.origin));
  }

  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  if (!isValidReference(reference)) return back("payment-failed");

  let payment;
  try {
    payment = await verifyFeePayment(reference);
  } catch (error) {
    console.error("Paystack verification failed", error);
    return back("payment-pending");
  }
  if (!payment || payment.metadata.applicationId !== id || payment.metadata.studentId !== auth.user.id) return back("payment-failed");

  const result = await recordFeePayment(payment).catch((error) => {
    console.error(error);
    return null;
  });
  if (!result || result === "mismatch") return back("payment-pending");
  if (result === "duplicate-payment") return back("paid-twice");

  const { error } = await supabase.rpc("submit_application", { p_application_id: id });
  if (error) return back("paid");
  const { sendPortalUpdateEmail } = await import("@/lib/portal/email");
  await sendPortalUpdateEmail(auth.user.id, "application submitted to GlobalPath");
  return back("paid-submitted");
}
