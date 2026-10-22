import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { CheckList } from "@/components/CheckList";
import { Notice } from "@/components/Notice";
import { ButtonLink } from "@/components/Button";
import { CTASection } from "@/components/CTASection";
import { ProcessSteps } from "@/components/ProcessSteps";
import { Icon, type IconName } from "@/components/Icon";
import { decisionDisclaimer, requirementsChangeNotice } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Student Visa Application Support",
  description:
    "Student visa documentation support for Nigerian and African applicants: checklists, application review, embassy requirements, appointment and interview preparation. We never guarantee visas.",
  path: "/visa-support",
  keywords: ["student visa documentation", "Germany student visa Nigeria", "Canada study visa support", "visa interview preparation"],
});

const services: { title: string; text: string; icon: IconName }[] = [
  { title: "Document checklist", text: "A checklist built for your destination, visa type and personal situation.", icon: "clipboard" },
  { title: "Application review", text: "We check your forms and documents for gaps and inconsistencies before you submit.", icon: "search" },
  { title: "Embassy requirement guidance", text: "What the mission asks for, in what format and in what order.", icon: "building" },
  { title: "Appointment preparation", text: "What to bring, how to organise it and what to expect on the day.", icon: "calendar" },
  { title: "Interview preparation", text: "Practice sessions so you can explain your study plans and funding clearly and truthfully.", icon: "chat" },
  { title: "Supporting-document organisation", text: "Your file arranged logically so the officer can find what they need.", icon: "file" },
];

export default function VisaSupportPage() {
  return (
    <>
      <PageHero
        title="Student visa application support"
        intro="Understand exactly what your destination asks for, and submit a complete, consistent and honest application."
        crumbs={[{ label: "Services", href: "/services" }, { label: "Visa Support" }]}
      >
        <ButtonLink href="/book-consultation?service=visa">Request a Review</ButtonLink>
      </PageHero>

      <Section tone="white">
        <Notice tone="integrity" title="We cannot guarantee a visa">
          {decisionDisclaimer}
        </Notice>
        <div className="mt-14">
          <SectionHeading title="How we help" />
          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.title}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-soft text-navy">
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-muted">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading title="Our visa support process" />
        <div className="mt-12">
          <ProcessSteps
            steps={[
              { title: "Requirements check", text: "We confirm the current official requirements for your visa type." },
              { title: "Personal checklist", text: "You receive a checklist tailored to your situation." },
              { title: "Document review", text: "We review your documents and flag anything missing or unclear." },
              { title: "Appointment & interview", text: "We prepare you for biometrics and any interview." },
              { title: "After the decision", text: "We help you plan travel, or review a refusal letter with you." },
            ]}
          />
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title="Common reasons applications run into problems" intro="Most issues are avoidable with preparation." />
          </div>
          <div>
            <CheckList
              items={[
                "Missing or out-of-date documents",
                "Financial evidence that doesn't meet the destination's rules",
                "Inconsistent information between forms and documents",
                "Unclear study plans or weak link to previous studies",
                "Translations that are not in the accepted format",
                "Applying too late for the intake",
              ]}
            />
            <Notice className="mt-8">{requirementsChangeNotice}</Notice>
          </div>
        </div>
      </Section>

      <CTASection title="Preparing a visa application?" text="Send us your destination and intake. We will tell you what the application involves and how we can help." />
    </>
  );
}
