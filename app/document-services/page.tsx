import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { CheckList } from "@/components/CheckList";
import { Notice } from "@/components/Notice";
import { ButtonLink } from "@/components/Button";
import { ContactForm } from "@/components/ContactForm";
import { CTASection } from "@/components/CTASection";
import { Icon, type IconName } from "@/components/Icon";
import { documentFields } from "@/data/forms";
import { buildMetadata } from "@/lib/seo";
import { whatsappMessageForPath } from "@/lib/whatsapp";

export const metadata = buildMetadata({
  title: "Document Translation & Notarization for Visa and Admission",
  description:
    "Translation of diplomas, transcripts, police clearance, birth and marriage certificates for university admission and visa applications, with notarization coordination and certification guidance.",
  path: "/document-services",
  keywords: ["document translation for visa", "certificate translation Nigeria", "notarization for student visa", "transcript translation"],
});

const groups: { id: string; title: string; icon: IconName; items: string[] }[] = [
  { id: "academic", title: "Academic documents", icon: "graduation", items: ["Diplomas and degree certificates", "Academic transcripts", "WAEC / NECO results", "Recommendation letters"] },
  { id: "immigration", title: "Immigration documents", icon: "stamp", items: ["Police clearance / character certificates", "Sponsorship and support letters", "Employment letters", "Bank reference letters"] },
  { id: "personal", title: "Personal documents", icon: "file", items: ["Birth certificates", "Marriage certificates", "Change-of-name documents", "Other supporting documents"] },
  { id: "notarization", title: "Certification & notarization coordination", icon: "filecheck", items: ["Notarization of translations", "Guidance on apostille and legalisation", "Checking which format your institution accepts"] },
];

export default function DocumentServicesPage() {
  return (
    <>
      <PageHero
        title="Translation & document preparation"
        intro="Translations and certified copies prepared in the format your university or embassy asks for."
        crumbs={[{ label: "Services", href: "/services" }, { label: "Document Services" }]}
      >
        <ButtonLink href="#quote">Get Document Support</ButtonLink>
      </PageHero>

      <Section tone="white">
        <div className="grid gap-6 md:grid-cols-2">
          {groups.map((g) => (
            <article key={g.id} id={g.id} className="scroll-mt-28 rounded-3xl border border-line p-6 md:p-8">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-soft text-navy">
                  <Icon name={g.icon} className="h-6 w-6" />
                </span>
                <h2 className="font-display text-xl font-bold text-ink">{g.title}</h2>
              </div>
              <CheckList items={g.items} className="mt-6" />
            </article>
          ))}
        </div>
        {/* CONFIRM with owner: who performs translations and which certifications they hold. Adjust this notice accordingly. */}
        <Notice className="mt-8">
          Translations are completed by qualified translators we work with, and notarization is carried out by a licensed notary. Requirements differ between institutions, so we confirm the accepted format before starting.
        </Notice>
      </Section>

      <Section tone="canvas" id="quote">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionHeading title="Request a translation quote" intro="Tell us what you need translated and by when. We will reply with a price and timeline." />
            <Notice tone="integrity" className="mt-8" title="Your documents stay private">
              This form does not upload your files. After we contact you, we will share a secure way to send the documents.
            </Notice>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line md:p-10">
            <ContactForm fields={documentFields} formType="document-quote" submitLabel="Request a Quote" successTitle="Quote requested" showUpload />
          </div>
        </div>
      </Section>

      <CTASection title="Need documents ready for a deadline?" text="Tell us your deadline on WhatsApp and we will tell you straight away whether it is achievable." whatsappMessage={whatsappMessageForPath("/document-services")} />
    </>
  );
}
