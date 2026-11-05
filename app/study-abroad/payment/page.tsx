import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Section } from "@/components/Section";
import { ButtonLink } from "@/components/Button";
import { applicationFee } from "@/data/site";
import { isPaystackConfigured, verifyFeePayment } from "@/lib/paystack";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Application Fee Payment",
  robots: { index: false, follow: false },
};

/**
 * Paystack sends the student back here after checkout. This page only shows
 * the result; the webhook is what delivers the paid request to the team.
 */
export default async function PaymentResultPage({ searchParams }: PageProps<"/study-abroad/payment">) {
  const { reference } = await searchParams;
  let paid = false;
  if (isPaystackConfigured && typeof reference === "string") {
    try {
      paid = Boolean(await verifyFeePayment(reference));
    } catch {
      paid = false;
    }
  }

  return (
    <Section tone="canvas">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-line md:p-10" role="status">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#1FAF55]" aria-hidden="true" />
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">Payment received</h1>
            <p className="mt-2 text-ink-muted">
              Thank you. Your {applicationFee.label} application fee was paid and your eligibility review request is with our team. We will contact you to discuss next steps.
            </p>
            <p className="mt-2 text-sm text-ink-faint">Payment reference: {reference}</p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-12 w-12 text-[#C8341B]" aria-hidden="true" />
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">Payment not confirmed</h1>
            <p className="mt-2 text-ink-muted">
              We could not confirm your application fee payment. If money left your account, message us with your payment reference and we will check it. Otherwise you can try again.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          {!paid && <ButtonLink href="/study-abroad#eligibility">Try again</ButtonLink>}
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline underline-offset-2">
            Message us on WhatsApp
          </a>
        </div>
      </div>
    </Section>
  );
}
