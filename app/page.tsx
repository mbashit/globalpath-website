import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { Section, SectionHeading } from "@/components/Section";
import { ServiceCard } from "@/components/ServiceCard";
import { ProcessSteps } from "@/components/ProcessSteps";
import { CountryCard } from "@/components/CountryCard";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { ButtonLink } from "@/components/Button";
import { CheckList } from "@/components/CheckList";
import { Notice } from "@/components/Notice";
import { Icon, type IconName } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import { Reveal } from "@/components/Reveal";
import { StudentPortalSection } from "@/components/StudentPortalSection";
import { homeServices } from "@/data/services";
import { destinations } from "@/data/destinations";
import { publishedTestimonials, testimonials } from "@/data/testimonials";
import { homeFaqPreview } from "@/data/faqs";
import { images } from "@/data/images";
import { applicationFee, fundsIntegrityNotice, siteConfig } from "@/data/site";
import { buildMetadata, baseKeywords } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Study Abroad, Admission & Visa Documentation Support for African Students",
  description:
    "Professional guidance for Nigerian and African students and families: university applications and admission, visa documentation, proof of funds guidance, translation, flight booking and accommodation for Germany, Canada, the UK, the USA and Russia.",
  path: "/",
  keywords: [...baseKeywords, "study in Germany from Nigeria", "Canada study visa support", "proof of funds guidance"],
});

// Non-numeric trust points – no invented statistics.
const trustPoints: { title: string; text: string; icon: IconName }[] = [
  { title: "Multiple study destinations", text: "Germany, Canada, the UK, the USA and Russia.", icon: "globe" },
  { title: "Support at agreed stages", text: "Discuss the specific steps you need help with.", icon: "route" },
  { title: "Student & family assistance", text: "Guidance for applicants and their sponsors.", icon: "users" },
  { title: "Remote consultation requests", text: "Ask about a WhatsApp call or video consultation.", icon: "video" },
];

const whyUs: { title: string; text: string; icon: IconName }[] = [
  { title: "Personalised guidance", text: "Advice based on your grades, budget and goals, not a one-size-fits-all package.", icon: "compass" },
  { title: "Transparent process", text: "You know what each step involves, what it costs and who decides.", icon: "eye" },
  { title: "International application support", text: "Help with requirements that differ from country to country.", icon: "globe" },
  { title: "Document assistance", text: "Checklists, translation and notarization coordination in one place.", icon: "clipboard" },
  { title: "Student-focused service", text: "We explain things clearly to students and to the parents who support them.", icon: "heart" },
  { title: "Support from application to arrival", text: "Pre-departure and arrival guidance, not just paperwork.", icon: "plane" },
];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* Trust points */}
      <section className="bg-white py-14 md:py-16" aria-label="How we support you">
        <div className="container">
        <ul className="grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((p) => (
            <li key={p.title} className="bg-white p-6 md:p-7">
              <Icon name={p.icon} className="h-7 w-7 text-navy" />
              <h2 className="mt-4 font-display text-lg font-semibold text-ink">{p.title}</h2>
              <p className="mt-1 text-[0.95rem] text-ink-muted">{p.text}</p>
            </li>
          ))}
        </ul>
        </div>
      </section>

      {/* Services */}
      <Section tone="canvas" id="services">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            title="Everything you need for your international journey"
            intro="Explore the services and agree on a clear scope before paid work begins."
          />
          <ButtonLink href="/services" variant="outline" className="shrink-0">View all services</ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {homeServices.map((s) => (
            <ServiceCard key={s.title} service={s} />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section tone="white" id="how-it-works">
          <SectionHeading title="How it works" intro="A straightforward request-and-review process. Any appointment or service is confirmed with you before work begins." />
        <Reveal className="mt-12">
          <ProcessSteps />
        </Reveal>
        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/study-abroad#eligibility">Check Your Eligibility · {applicationFee.label}</ButtonLink>
          <ButtonLink href="/book-consultation" variant="outline">Talk to an Adviser</ButtonLink>
        </div>
      </Section>

      <StudentPortalSection />

      {/* Destinations */}
      <Section tone="canvas" id="destinations">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading title="Where would you like to study?" intro="Explore our current destination guides. Requirements and available support vary by country and programme." />
          <ButtonLink href="/destinations" variant="outline" className="shrink-0">Explore Study Destinations</ButtonLink>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {destinations.map((d, i) => (
            <div key={d.slug} className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}>
              <CountryCard d={d} />
            </div>
          ))}
        </div>
      </Section>

      {/* Why choose us */}
      <Section tone="white" id="why-us">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionHeading title="What our guidance focuses on" intro="Clear explanations, genuine documents, realistic options and agreed next steps." />
            <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-3xl bg-navy-soft lg:block">
              <SmartImage src={images.consultation.src} alt={images.consultation.alt} fill sizes="40vw" className="object-cover" />
            </div>
          </div>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {whyUs.map((w) => (
              <li key={w.title}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-soft text-navy">
                  <Icon name={w.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{w.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-muted">{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Proof of funds */}
      <Section tone="canvas" id="proof-of-funds">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-white p-6 ring-1 ring-line md:p-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading
              title="Understand your proof of funds requirements"
              intro="Different countries require applicants to demonstrate that sufficient financial resources are available for tuition and living expenses. We help clients understand these requirements and prepare appropriate supporting documentation."
            />
            <CheckList
              className="mt-8 sm:columns-2 sm:gap-6 [&>li]:break-inside-avoid"
              items={[
                "Financial requirement consultation",
                "Sponsorship documentation guidance",
                "Blocked-account guidance where applicable",
                "Bank-document checklist",
                "Source-of-funds documentation guidance",
                "Scholarship and document review",
              ]}
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/proof-of-funds">Discuss Your Financial Documentation</ButtonLink>
            </div>
            <Notice tone="integrity" className="mt-6">{fundsIntegrityNotice}</Notice>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy-soft lg:aspect-[4/5]">
            <SmartImage src={images.fundsGuidance.src} alt={images.fundsGuidance.alt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
        </div>
      </Section>

      <Section tone="canvas" id="approach">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeading title="Honest guidance, without outcome promises" intro="Admission and visa decisions belong to universities and immigration authorities. We focus on helping you understand requirements, organise genuine documents and prepare a complete application." />
          <ButtonLink href="/about" variant="outline" className="shrink-0">How we work</ButtonLink>
        </div>
      </Section>

      {/* Testimonials – the marquee runs edge to edge, outside the container */}
      <section id="stories" className="scroll-mt-24 overflow-hidden bg-canvas py-16 md:py-24">
        <div className="container flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading title="Student and family stories" intro="Students and parents from across Africa share their journeys to Germany, Canada, the UK and the USA." />
          {publishedTestimonials.length > 0 && (
            <ButtonLink href="/success-stories" variant="outline" className="shrink-0">View all stories</ButtonLink>
          )}
        </div>
        <div className="mt-10">
          <TestimonialMarquee testimonials={testimonials} />
        </div>
      </section>

      {/* FAQ preview */}
      <Section tone="white" id="faq">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionHeading title="Questions students and parents ask us" intro={`Can't find your answer? Message ${siteConfig.shortName} on WhatsApp and we will reply.`} />
            <Link href="/faqs" className="mt-6 inline-flex min-h-[44px] items-center font-semibold text-navy underline decoration-brandorange decoration-2 underline-offset-[6px]">
              See all FAQs
            </Link>
          </div>
          <FAQAccordion items={homeFaqPreview} />
        </div>
      </Section>

      <CTASection />
    </>
  );
}
