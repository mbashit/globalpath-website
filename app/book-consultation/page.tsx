import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { Notice } from "@/components/Notice";
import { Icon } from "@/components/Icon";
import { consultationFields } from "@/data/forms";
import { consultationTypes } from "@/data/services";
import { siteConfig, decisionDisclaimer } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Request a Consultation",
  description:
    "Request an online consultation for study abroad, visa documentation, financial-document guidance, translation or relocation.",
  path: "/book-consultation",
});

export default function BookConsultationPage() {
  return (
    <>
      <PageHero
        title="Request a consultation"
        intro="Tell us what you need help with and how to reach you. We will contact you to agree on a time; submitting this request does not book or confirm an appointment."
        crumbs={[{ label: "Request a Consultation" }]}
      />

      <Section tone="canvas">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Consultation types</h2>
            <ul className="mt-5 space-y-3">
              {consultationTypes.map((c) => (
                <li key={c.value} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
                  <Icon name="calendar" className="h-5 w-5 shrink-0 text-brandorange" />
                  <span className="font-semibold text-ink">{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3 rounded-2xl bg-navy p-5 text-white">
              <Icon name="video" className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <p>Online consultations can be arranged by WhatsApp call or video. Include your timezone when sharing a preferred time; no slot is confirmed until we contact you.</p>
            </div>
            <Notice className="mt-6">{decisionDisclaimer}</Notice>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line md:p-10">
            {siteConfig.bookingEmbedUrl ? (
              /* Calendly / Google Calendar appointment page / other booking tool.
                 Set `bookingEmbedUrl` in data/site.ts to enable. */
              <iframe
                src={siteConfig.bookingEmbedUrl}
                title="Book a consultation"
                className="h-[720px] w-full rounded-2xl border-0"
                loading="lazy"
              />
            ) : (
              <>
                {/*
                  FUTURE INTEGRATION: to let clients pick a live slot, set
                  `bookingEmbedUrl` in data/site.ts to a Calendly link,
                  a Google Calendar appointment schedule, Cal.com or similar.
                  The iframe above renders automatically in place of this form.
                */}
                <h2 className="font-display text-2xl font-bold text-ink">Request a consultation</h2>
                <p className="mt-2 text-ink-muted">Preferred dates and times are requests only. We will agree on availability and timezone with you directly.</p>
                <div className="mt-8">
                  <ContactForm
                    fields={consultationFields}
                    formType="consultation"
                    submitLabel="Send Consultation Request"
                    successTitle="Consultation requested"
                    successText="Your request was delivered. We will contact you to discuss a suitable time; this is not a confirmed appointment."
                    prefillFromAccount
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
