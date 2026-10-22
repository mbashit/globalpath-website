import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { TestimonialCard } from "@/components/TestimonialCard";
import { CTASection } from "@/components/CTASection";
import { Notice } from "@/components/Notice";
import { Icon, type IconName } from "@/components/Icon";
import { testimonials } from "@/data/testimonials";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Success Stories",
  description: "Experiences from students and families we have supported with admissions, visa documentation and relocation.",
  path: "/success-stories",
});

/*
 * SOCIAL PROOF BLOCKS
 * Each block below is a placeholder. Replace with real, verified material:
 *  - Google Reviews: embed your Google Business Profile reviews widget
 *  - WhatsApp feedback: screenshots ONLY with the client's written consent,
 *    with phone numbers and personal details blurred
 *  - Admission letters: redact names, dates of birth, reference numbers
 * Never fabricate reviews – it is misleading and may breach consumer law.
 */
const proofBlocks: { title: string; text: string; icon: IconName }[] = [
  { title: "Google Reviews", text: "Replace with your Google Business Profile reviews.", icon: "sparkles" },
  { title: "WhatsApp client feedback", text: "Replace with consented, anonymised client messages.", icon: "chat" },
  { title: "Admission letters", text: "Replace with redacted offer letters, shared with permission.", icon: "mail" },
  { title: "University acceptance stories", text: "Replace with short stories from students now studying abroad.", icon: "graduation" },
];

export default function SuccessStoriesPage() {
  return (
    <>
      <PageHero
        title="Success stories"
        intro="Every story here will come from a real client who has agreed to share it."
        crumbs={[{ label: "Success Stories" }]}
      />

      <Section tone="canvas">
        <Notice className="mb-10">
          The testimonials below are placeholders while we collect verified reviews from clients.
        </Notice>
        <div className="grid gap-5 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading title="More from our clients" intro="Reviews, feedback and acceptance stories will appear here." />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {proofBlocks.map((b) => (
            <li key={b.title} className="flex min-h-[200px] flex-col rounded-2xl border-2 border-dashed border-navy/20 p-6">
              <Icon name={b.icon} className="h-7 w-7 text-navy" />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{b.title}</h3>
              <p className="mt-1.5 text-sm text-ink-faint">{b.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CTASection title="Your story could be next" text="Start with a conversation about your plans." />
    </>
  );
}
