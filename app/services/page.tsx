import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { CheckList } from "@/components/CheckList";
import { Notice } from "@/components/Notice";
import { ButtonLink } from "@/components/Button";
import { CTASection } from "@/components/CTASection";
import { Icon } from "@/components/Icon";
import { serviceCategories } from "@/data/services";
import { decisionDisclaimer } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services: Admissions, Visa Support, Financial Guidance, Translation & Relocation",
  description:
    "University admission support, student visa documentation, proof of funds guidance, document translation and notarization coordination, and relocation support for African students and families.",
  path: "/services",
  keywords: ["student visa documentation", "document translation for visa", "proof of funds guidance", "university admission assistance"],
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Services for every stage of your move abroad"
        intro="Explore the support areas. Confirm scope, provider, fees and timing in writing before agreeing to paid work."
        crumbs={[{ label: "Services" }]}
      >
          <ButtonLink href="/book-consultation">Request a Consultation</ButtonLink>
      </PageHero>

      {/* Quick jump */}
      <div className="sticky top-[72px] z-20 border-b border-line bg-white/95 backdrop-blur">
        <nav aria-label="Service categories" className="container flex gap-2 overflow-x-auto py-3">
          {serviceCategories.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="inline-flex min-h-[40px] shrink-0 items-center rounded-full bg-canvas px-4 text-sm font-semibold text-navy ring-1 ring-line hover:ring-navy">
              {c.title}
            </a>
          ))}
        </nav>
      </div>

      <Section tone="white">
        <div className="space-y-6">
          {serviceCategories.map((c, i) => (
            <article key={c.id} id={c.id} className="scroll-mt-36 grid gap-8 rounded-3xl border border-line p-6 md:p-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
              <div>
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${i % 2 ? "bg-gold-soft text-navy" : "bg-navy text-gold"}`}>
                  <Icon name={c.icon} className="h-7 w-7" />
                </span>
                <h2 className="mt-5 font-display text-[1.8rem] font-bold leading-tight text-ink">{c.title}</h2>
                <p className="mt-3 leading-relaxed text-ink-muted">{c.intro}</p>
                <div className="mt-6">
                  <ButtonLink href={c.cta.href} variant="navy">{c.cta.label}</ButtonLink>
                </div>
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink">What&apos;s included</h3>
                <CheckList items={c.items} className="mt-4 sm:columns-2 sm:gap-6 [&>li]:break-inside-avoid [&>li]:mb-2.5" />
                {c.note && <Notice tone={c.id === "financial" ? "integrity" : "info"} className="mt-6">{c.note}</Notice>}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-10 max-w-3xl text-sm text-ink-faint">
          {decisionDisclaimer} See our <Link href="/disclaimer" className="underline">full disclaimer</Link>.
        </p>
      </Section>

      <CTASection />
    </>
  );
}
