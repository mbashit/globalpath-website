import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppGlyph } from "@/components/SocialIcons";
import { Icon } from "@/components/Icon";
import { contactFields } from "@/data/forms";
import { siteConfig } from "@/data/site";
import { whatsappLink } from "@/lib/whatsapp";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Us",
  description: `Contact ${siteConfig.name} by WhatsApp, phone or email for study abroad, visa documentation, translation, flight and accommodation enquiries.`,
  path: "/contact",
});

export default function ContactPage() {
  const { address } = siteConfig;
  return (
    <>
      <PageHero title="Contact us" intro="The fastest way to reach us is WhatsApp. You can also call, email or send the form below." crumbs={[{ label: "Contact" }]} />

      <Section tone="canvas">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
          <div className="space-y-4">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-3xl bg-[#1FAF55] p-6 text-white transition-colors hover:bg-[#178a43]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
                <WhatsAppGlyph className="h-7 w-7" />
              </span>
              <span>
                <span className="block font-display text-xl font-bold">Chat on WhatsApp</span>
                <span className="block text-white/85">Message us with your question</span>
              </span>
            </a>

            <ul className="divide-y divide-line rounded-3xl bg-white ring-1 ring-line">
              <li className="flex gap-4 p-5">
                <Icon name="phone" className="mt-0.5 h-5 w-5 text-navy" />
                <div>
                  <p className="text-sm text-ink-faint">Phone</p>
                  <a href={`tel:${siteConfig.phoneHref}`} className="font-semibold text-ink hover:text-navy">{siteConfig.phoneDisplay}</a>
                </div>
              </li>
              <li className="flex gap-4 p-5">
                <Icon name="email" className="mt-0.5 h-5 w-5 text-navy" />
                <div className="min-w-0">
                  <p className="text-sm text-ink-faint">Email</p>
                  <a href={`mailto:${siteConfig.email}`} className="break-all font-semibold text-ink hover:text-navy">{siteConfig.email}</a>
                </div>
              </li>
              <li className="flex gap-4 p-5">
                <Icon name="pin" className="mt-0.5 h-5 w-5 text-navy" />
                <div>
                  <p className="text-sm text-ink-faint">Office address</p>
                  {address.confirmed ? (
                    <p className="font-semibold text-ink">
                      {[address.street, address.city, address.country].filter(Boolean).join(", ")}
                      {address.mapUrl && (
                        <a href={address.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-navy underline">Open in Google Maps</a>
                      )}
                    </p>
                  ) : (
                    <p className="font-semibold text-ink">Contact us to discuss meeting options.</p>
                  )}
                </div>
              </li>
              <li className="flex gap-4 p-5">
                <Icon name="clock" className="mt-0.5 h-5 w-5 text-navy" />
                <div>
                  <p className="text-sm text-ink-faint">Office hours</p>
                  <dl className="mt-1 space-y-1">
                    {siteConfig.officeHours.map((h) => (
                      <div key={h.days} className="flex flex-wrap gap-x-3">
                        <dt className="font-semibold text-ink">{h.days}</dt>
                        <dd className="text-ink-muted">{h.hours}</dd>
                      </div>
                    ))}
                  </dl>
                  {siteConfig.timeZoneNote && <p className="mt-1 text-sm text-ink-faint">{siteConfig.timeZoneNote}</p>}
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line md:p-10">
            <h2 className="font-display text-2xl font-bold text-ink">Send us a message</h2>
            <p className="mt-2 text-ink-muted">We reply by WhatsApp or email.</p>
            <div className="mt-8">
              <ContactForm fields={contactFields} formType="contact" submitLabel="Send Message" successTitle="Message sent" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
