import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { ButtonLink } from "@/components/Button";
import { ContactForm } from "@/components/ContactForm";
import { Notice } from "@/components/Notice";
import { CTASection } from "@/components/CTASection";
import { SmartImage } from "@/components/SmartImage";
import { eligibilityFields } from "@/data/forms";
import { applicationFee, decisionDisclaimer } from "@/data/site";
import { images } from "@/data/images";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Study Abroad With Confidence",
  description:
    "A step-by-step guide to studying abroad from Nigeria and Africa: choosing a destination and programme, admission requirements, documents, offers, visas and pre-departure. Request an eligibility review.",
  path: "/study-abroad",
  keywords: ["study abroad from Nigeria", "university admission assistance", "study abroad consultant Africa"],
});

const stages = [
  { id: "why", title: "Why study abroad", text: "International study can open doors to specialised programmes, global qualifications and new career paths. It is also a major financial and personal decision, so it deserves careful planning." },
  { id: "destination", title: "Choosing your destination", text: "Compare tuition, living costs, language of teaching, visa rules and post-study options. We explain the trade-offs honestly so you can decide with your family." },
  { id: "program", title: "Choosing your programme", text: "Match programmes to your previous studies and career goals. Some countries require a foundation or preparatory year first; we tell you early if that applies." },
  { id: "requirements", title: "Understanding admission requirements", text: "Entry rules vary: minimum grades, WAEC/NECO subject combinations, language tests, portfolios or entrance exams. We review these against your profile." },
  { id: "documents", title: "Preparing documents", text: "Certificates, transcripts, passport, CV, statement of purpose and references. We give you a checklist and arrange translations where needed." },
  { id: "applying", title: "Applying to universities", text: "We help you organise and submit complete applications and keep track of deadlines and portal messages." },
  { id: "offer", title: "Receiving an offer", text: "We explain the conditions in your offer letter, deposits, deadlines and what to do before accepting." },
  { id: "visa", title: "Visa preparation", text: "Once admitted, we guide you through the visa checklist, financial documentation and interview preparation for your destination." },
  { id: "departure", title: "Pre-departure preparation", text: "Accommodation, travel, insurance, what to pack and what to do in your first week. You leave knowing what to expect." },
];

export default function StudyAbroadPage() {
  return (
    <>
      <PageHero
        title="Study abroad with confidence"
        intro="Understand the steps from choosing a country to preparing for travel, and request guidance for the stages you need help with."
        crumbs={[{ label: "Study Abroad" }]}
      >
        <ButtonLink href="#eligibility">Request an Eligibility Review</ButtonLink>
        <ButtonLink href="/destinations" variant="ghostLight">Explore Study Destinations</ButtonLink>
      </PageHero>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading title="The study abroad journey" intro="Nine stages, explained in plain language. Jump to any stage or read from the start." />
            <nav aria-label="Stages" className="mt-6 hidden lg:block">
              <ol className="space-y-1">
                {stages.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex min-h-[36px] items-center gap-3 text-ink-muted hover:text-navy">
                      <span className="w-6 text-sm font-bold text-brandorange">{i + 1}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-3xl bg-navy-soft lg:block">
              <SmartImage src={images.graduation.src} alt={images.graduation.alt} fill sizes="35vw" className="object-cover" />
            </div>
          </div>

          <ol className="space-y-4">
            {stages.map((s, i) => (
              <li key={s.id} id={s.id} className="scroll-mt-28 rounded-2xl border border-line p-6 md:p-7">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-2xl font-extrabold text-brandorange">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-muted">{s.text}</p>
                  </div>
                </div>
                {(i === 3 || i === 7) && (
                  <div className="mt-5 pl-10">
                    <ButtonLink href="#eligibility" variant="outline" className="min-h-[44px] py-2 text-sm">Request an Eligibility Review</ButtonLink>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="canvas" id="eligibility">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionHeading
              title="Request an eligibility review"
              intro="Tell us about your studies and plans. An adviser will review your profile and contact you with realistic options and next steps."
            />
            <p className="mt-6 text-ink-muted">
              <strong className="text-ink">Application fee: {applicationFee.label}.</strong> After you submit the form you will be taken to Paystack to pay securely by card or bank transfer. Your request is sent to our team once payment is confirmed.
            </p>
            <Notice className="mt-8">{decisionDisclaimer}</Notice>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line md:p-10">
            <ContactForm fields={eligibilityFields} formType="eligibility-review" submitLabel={`Continue to Pay ${applicationFee.label}`} successTitle="Eligibility review requested" />
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
