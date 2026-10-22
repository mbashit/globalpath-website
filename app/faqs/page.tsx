import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { faqs, type FAQ } from "@/data/faqs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about studying abroad from Nigeria and Africa: getting started, admissions, documents, proof of funds, sponsorship, translation, visas and working with us.",
  path: "/faqs",
});

const order: FAQ["category"][] = ["Getting started", "Admissions", "Documents & funds", "Visas", "Working with us"];

export default function FAQsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <PageHero title="Frequently asked questions" intro="Straight answers to the questions students and parents ask most." crumbs={[{ label: "FAQs" }]} />
      <Section tone="canvas">
        <div className="mx-auto max-w-3xl space-y-12">
          {order.map((cat) => {
            const items = faqs.filter((f) => f.category === cat);
            const id = `cat-${cat.toLowerCase().replace(/[^a-z]+/g, "-")}`;
            if (!items.length) return null;
            return (
              <section key={cat} aria-labelledby={id}>
                <h2 id={id} className="mb-4 font-display text-2xl font-bold text-ink">{cat}</h2>
                <FAQAccordion items={items} defaultOpen={null} />
              </section>
            );
          })}
        </div>
      </Section>
      <CTASection title="Still have a question?" text="Message us on WhatsApp or book a consultation and we will answer it personally." />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
