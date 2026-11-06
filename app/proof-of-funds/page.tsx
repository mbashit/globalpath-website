import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { Notice } from "@/components/Notice";
import { ButtonLink } from "@/components/Button";
import { ContactForm } from "@/components/ContactForm";
import { CTASection } from "@/components/CTASection";
import { SmartImage } from "@/components/SmartImage";
import { financialReviewFields } from "@/data/forms";
import { getSiteImages } from "@/lib/site-content";
import { decisionDisclaimer, fundsIntegrityNotice, requirementsChangeNotice } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Proof of Funds & Financial Documentation Guidance",
  description:
    "What proof of funds means for student visas, who can sponsor you, which financial documents are commonly accepted, blocked accounts, source of funds and common mistakes. Genuine documentation only.",
  path: "/proof-of-funds",
  keywords: ["proof of funds guidance", "proof of funds student visa Nigeria", "sponsorship letter student visa", "blocked account Germany Nigeria"],
});

const sections = [
  {
    id: "what",
    title: "What is proof of funds?",
    body: [
      "Proof of funds is evidence that you, or the person sponsoring you, genuinely have enough money to pay for tuition, living costs and sometimes travel for the period of study.",
      "Immigration authorities ask for it because they need to be confident you can support yourself without breaking the rules of your visa. Each country sets its own amounts, accepted account types and rules about how long the money must be held.",
    ],
  },
  {
    id: "sponsorship",
    title: "Who can sponsor a student?",
    body: [
      "Many destinations accept funding from the student, parents, close relatives, an employer, a government body or a scholarship provider. Some countries restrict who can be a sponsor or require a specific official form.",
      "A sponsor usually needs to show their relationship to you, their own genuine funds, and where that money comes from.",
    ],
  },
  {
    id: "documents",
    title: "Common financial documents",
    list: [
      "Bank statements covering the period required by the destination",
      "Bank reference or confirmation letter",
      "Sponsor's letter of support and proof of relationship (e.g. birth certificate)",
      "Evidence of sponsor's income (employment letter, payslips, business records, tax documents)",
      "Scholarship or funding award letters",
      "Tuition payment receipts",
      "Blocked account confirmation where applicable",
    ],
  },
  {
    id: "letters",
    title: "Sponsorship letters",
    body: [
      "A sponsorship letter is written and signed by your real sponsor. It states who they are, their relationship to you and what they will pay for. It should match the rest of your documents.",
      "We can explain what information such a letter normally contains and review it for completeness. The letter must reflect a genuine commitment from a real sponsor.",
    ],
  },
  {
    id: "statements",
    title: "Bank statements",
    body: [
      "Officers look at the balance, the account history and whether large deposits can be explained. Statements usually need to be recent, show the account holder's name and come directly from the bank in the accepted format.",
    ],
  },
  {
    id: "scholarships",
    title: "Scholarships",
    body: [
      "An official award letter can cover some or all of your costs. Check exactly what it covers; you may still need to show funds for the remainder.",
    ],
  },
  {
    id: "blocked",
    title: "Blocked accounts",
    body: [
      "Some destinations, notably Germany, commonly use a blocked account: you deposit a set yearly amount with an approved provider and receive a fixed monthly withdrawal after arrival. The required amount is set by the authorities and changes, so always check the current figure.",
    ],
  },
  {
    id: "tuition",
    title: "Tuition deposits",
    body: [
      "Universities may require a deposit before issuing documents such as a CAS or I-20. Paid tuition can sometimes reduce the amount you need to show; the rules depend on the destination.",
    ],
  },
  {
    id: "source",
    title: "Source of funds",
    body: [
      "Authorities increasingly ask where money came from, not just how much there is. Be ready to explain significant deposits with documents such as a sale agreement, salary records or business accounts.",
    ],
  },
  {
    id: "mistakes",
    title: "Common mistakes",
    list: [
      "Large unexplained deposits shortly before applying",
      "Statements that don't cover the required period",
      "Sponsor documents that don't match the stated relationship or income",
      "Using an account type the destination doesn't accept",
      "Relying on someone offering to 'show' or 'park' money in your account",
      "Submitting altered, edited or third-party documents",
    ],
  },
];

export default async function ProofOfFundsPage() {
  const images = await getSiteImages();
  return (
    <>
      <PageHero
        title="Proof of funds & financial documentation guidance"
        intro="Understand what your destination asks for and present genuine, well-organised financial evidence."
        crumbs={[{ label: "Services", href: "/services" }, { label: "Proof of Funds Guidance" }]}
      >
        <ButtonLink href="#review">Request a Financial Documentation Review</ButtonLink>
      </PageHero>

      <Section tone="white">
        <Notice tone="warning" title="Never submit false or altered financial documents">
          Fraudulent documents can result in application refusal, visa bans, or other legal consequences. {fundsIntegrityNotice}
        </Notice>

        <div className="mt-14 grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="On this page">
              <p className="font-display font-semibold text-ink">On this page</p>
              <ul className="mt-3 flex flex-wrap gap-2 lg:block lg:space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="inline-flex min-h-[36px] items-center rounded-full bg-canvas px-3 text-sm text-ink-muted hover:text-navy lg:bg-transparent lg:px-0 lg:text-[0.95rem]">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <div className="prose-gp max-w-3xl">
            {sections.map((s, i) => (
              <div key={s.id}>
                <h2 id={s.id} className={i === 0 ? "!mt-0" : undefined}>{s.title}</h2>
                {s.body?.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                {s.list && (
                  <ul>
                    {s.list.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                )}
              </div>
            ))}
            <Notice className="mt-10">{requirementsChangeNotice} Country-specific notes are on each <Link href="/destinations">destination page</Link>.</Notice>
          </div>
        </div>
      </Section>

      <Section tone="canvas" id="review">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionHeading title="Request a financial documentation review" intro="Tell us about your destination and funding. We will explain the requirements and what your documents need to show." />
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-3xl bg-navy-soft">
              <SmartImage src={images.fundsGuidance.src} alt={images.fundsGuidance.alt} fill sizes="(max-width: 1024px) 100vw, 35vw" className="object-cover" />
            </div>
            <Notice tone="integrity" className="mt-8">
              Please do not send account numbers or statements through this form. We will agree a secure way to review documents with you.
            </Notice>
            <p className="mt-6 text-sm text-ink-faint">{decisionDisclaimer}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line md:p-10">
            <ContactForm fields={financialReviewFields} formType="financial-review" submitLabel="Request a Review" successTitle="Review requested" />
          </div>
        </div>
      </Section>

      <CTASection title="Questions about your finances?" text="A short consultation can save you from costly mistakes. Talk to us before you submit." />
    </>
  );
}
