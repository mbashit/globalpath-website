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
  title: "Book a Consultation",
  description:
    "Book an online or in-person consultation for study abroad, visa documentation review, financial documentation guidance, translation or relocation.",
  path: "/book-consultation",
});

export default function BookConsultationPage() {
  return (
    <>
      <PageHero
        title="Book a consultation"
        intro="Choose the kind of help you need and a preferred time. We will confirm your appointment by WhatsApp or email."
        crumbs={[{ label: "Book a Consultation" }]}
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
              <p>Online consultations by WhatsApp call or video are available wherever you are.</p>
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
                <h2 className="font-display text-2xl font-bold text-ink">Request your consultation</h2>
                <p className="mt-2 text-ink-muted">We will confirm the date and time with you.</p>
                <div className="mt-8">
                  <ContactForm
                    fields={consultationFields}
                    formType="consultation"
                    submitLabel="Book a Consultation"
                    successTitle="Consultation requested"
                    successText="Thank you. We will contact you to confirm your consultation time, usually by WhatsApp."
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
