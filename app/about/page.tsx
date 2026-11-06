import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { CTASection } from "@/components/CTASection";
import { SmartImage } from "@/components/SmartImage";
import { Icon, type IconName } from "@/components/Icon";
import { getSiteImages } from "@/lib/site-content";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Us",
  description: `Why we created ${siteConfig.name}: clear, transparent and professional guidance for African students and families planning to study abroad.`,
  path: "/about",
});

const values: { title: string; text: string; icon: IconName }[] = [
  { title: "Integrity", text: "Honest advice, genuine documents, no shortcuts.", icon: "shield" },
  { title: "Transparency", text: "Clear fees, clear steps and clear expectations.", icon: "eye" },
  { title: "Personal support", text: "A real adviser who knows your file.", icon: "heart" },
  { title: "Professionalism", text: "Organised, responsive and careful with your information.", icon: "badge" },
  { title: "Opportunity", text: "Helping you reach programmes that fit your ambitions.", icon: "sparkles" },
  { title: "International perspective", text: "Understanding how requirements differ between countries.", icon: "globe" },
];

export default async function AboutPage() {
  const images = await getSiteImages();
  return (
    <>
      <PageHero
        title="Making international education easier to understand"
        intro={`We created ${siteConfig.name} to make international education easier to understand for students and families across Africa.`}
        crumbs={[{ label: "About Us" }]}
      />

      <Section tone="white">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading title="Our mission" />
            <p className="mt-5 font-display text-2xl font-medium leading-snug text-navy md:text-[1.9rem]">
              To give applicants clear, transparent and professional guidance throughout their international journey.
            </p>
            <p className="mt-6 leading-relaxed text-ink-muted">
              Applying abroad involves unfamiliar requirements, multiple documents and significant financial decisions. We help students and families understand the steps, organise genuine documents and make informed choices without promising admission or visa outcomes.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy-soft">
            <SmartImage src={images.about.src} alt={images.about.alt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading title="Our values" />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <li key={v.title} className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <Icon name={v.icon} className="h-7 w-7 text-brandorange" />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{v.title}</h3>
              <p className="mt-1.5 text-ink-muted">{v.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="white">
        <SectionHeading title="What you can expect" intro="Clear next steps, careful document preparation and honest conversations about your options." />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "A conversation about your goals, qualifications and constraints",
            "Guidance based on the requirements of your chosen destination",
            "A written outline of the service scope and fees before paid work begins",
          ].map((item) => (
            <li key={item} className="rounded-xl border border-line bg-white p-5 text-ink-muted">{item}</li>
          ))}
        </ul>
      </Section>

      <CTASection title="Let's talk about your plans" />
    </>
  );
}
