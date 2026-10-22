import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { CTASection } from "@/components/CTASection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Success Stories",
  description: "How GlobalPath approaches study-abroad and documentation support, with client stories published only when verified and shared with permission.",
  path: "/success-stories",
  robots: { index: false, follow: true },
});

export default function SuccessStoriesPage() {
  return (
    <>
      <PageHero
        title="Success stories"
        intro="We share client experiences only when they are genuine, verified and published with the client’s permission."
        crumbs={[{ label: "Success Stories" }]}
      />

      <Section tone="canvas">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading title="No client stories are published yet" intro="We won’t invent outcomes or use private messages as testimonials. When clients choose to share their experience, we verify the details, remove sensitive information and get written consent before publishing." />
        </div>
      </Section>

      <CTASection title="Talk through your plans" text="Request a consultation to discuss your goals, questions and possible next steps." />
    </>
  );
}
