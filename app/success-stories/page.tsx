import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { CTASection } from "@/components/CTASection";
import { TestimonialCard } from "@/components/TestimonialCard";
import { publishedTestimonials } from "@/data/testimonials";
import { buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

export const metadata = buildMetadata({
  title: "Success Stories",
  description: "How GlobalPath approaches study-abroad and documentation support, with client stories published only when verified and shared with permission.",
  path: "/success-stories",
  robots: { index: false, follow: true },
});

export default function SuccessStoriesPage() {
  if (publishedTestimonials.length === 0) notFound();

  return (
    <>
      <PageHero
        title="Success stories"
        intro="We share client experiences only when they are genuine, verified and published with the client’s permission."
        crumbs={[{ label: "Success Stories" }]}
      />

      <Section tone="canvas">
        <div className="grid gap-5 md:grid-cols-2">
          {publishedTestimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </Section>

      <CTASection title="Talk through your plans" text="Request a consultation to discuss your goals, questions and possible next steps." />
    </>
  );
}
