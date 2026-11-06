import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { CheckList } from "@/components/CheckList";
import { Notice } from "@/components/Notice";
import { CTASection } from "@/components/CTASection";
import { ButtonLink } from "@/components/Button";
import { SmartImage } from "@/components/SmartImage";
import { WhatsAppGlyph } from "@/components/SocialIcons";
import { destinations as builtInDestinations, getDestination } from "@/data/destinations";
import { getDestinations } from "@/lib/site-content";
import { decisionDisclaimer, requirementsChangeNotice } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

export function generateStaticParams() {
  return builtInDestinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return {};
  return buildMetadata({
    title: `Study in ${d.name} from Nigeria and Africa`,
    description: `Study in ${d.name}: popular programmes, application process, financial requirements, student visa overview and typical documents. Get application support from our advisers.`,
    path: `/destinations/${d.slug}`,
    keywords: [`study in ${d.name} from Nigeria`, `${d.name} student visa Nigeria`, `${d.name} study visa support`],
  });
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destinations = await getDestinations();
  const d = destinations.find((x) => x.slug === slug);
  if (!d) notFound();

  const toc = [
    { id: "overview", label: "Overview" },
    { id: "options", label: "Popular study options" },
    { id: "process", label: "Application process" },
    { id: "finances", label: "Financial requirements" },
    { id: "visa", label: "Student visa" },
    { id: "documents", label: "Typical documents" },
    { id: "why", label: `Why students choose ${d.shortName}` },
  ];

  return (
    <>
      <PageHero
        title={`Study in ${d.name}`}
        intro={d.intro}
        crumbs={[{ label: "Destinations", href: "/destinations" }, { label: d.name }]}
        aside={
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/15 lg:block">
            <SmartImage src={d.image} alt={d.imageAlt} fill priority sizes="40vw" className="object-cover" />
          </div>
        }
      >
        <ButtonLink href={`/book-consultation?destination=${encodeURIComponent(d.name)}`}>Request a Consultation</ButtonLink>
        <ButtonLink href={whatsappLink(d.whatsappMessage)} variant="whatsapp" external>
          <WhatsAppGlyph /> Ask about {d.shortName}
        </ButtonLink>
      </PageHero>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="On this page">
              <p className="font-display font-semibold text-ink">On this page</p>
              <ul className="mt-3 flex flex-wrap gap-2 lg:block lg:space-y-1">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="inline-flex min-h-[36px] items-center rounded-full bg-canvas px-3 text-sm text-ink-muted hover:text-navy lg:bg-transparent lg:px-0 lg:text-[0.95rem]">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="prose-gp max-w-3xl">
            <h2 id="overview" className="!mt-0">Overview</h2>
            <p>{d.overview}</p>

            <h2 id="options">Popular study options</h2>
            <CheckList items={d.studyOptions} className="mt-5" />

            <h2 id="process">General application process</h2>
            <ol className="mt-5 space-y-3">
              {d.applicationProcess.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-gold">{i + 1}</span>
                  <span className="pt-1 text-ink-muted">{step}</span>
                </li>
              ))}
            </ol>

            <h2 id="finances">Financial requirements overview</h2>
            <p>{d.financialOverview}</p>
            <p>
              Read our <Link href="/proof-of-funds">proof of funds guide</Link> to understand what genuine financial documentation looks like.
            </p>

            <h2 id="visa">Student visa overview</h2>
            <p>{d.visaOverview}</p>

            <h2 id="documents">Typical documents</h2>
            <CheckList items={d.typicalDocuments} className="mt-5" />

            <h2 id="why">Why students choose {d.name}</h2>
            <CheckList items={d.whyStudents} className="mt-5" />

            <Notice className="mt-10" title="Check the official source">
              <p className="!mt-1 !text-inherit">{requirementsChangeNotice}</p>
              <ul className="!mt-2 !list-none !pl-0">
                {d.officialSources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
                  </li>
                ))}
              </ul>
            </Notice>
            <p className="text-sm">{decisionDisclaimer}</p>
          </div>
        </div>
      </Section>

      <Section tone="canvas">
        <h2 className="font-display text-2xl font-bold text-ink">Other destinations</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {destinations.filter((x) => x.slug !== d.slug).map((x) => (
            <li key={x.slug}>
              <Link href={`/destinations/${x.slug}`} className="inline-flex min-h-[44px] items-center rounded-full bg-white px-5 font-semibold text-navy ring-1 ring-line hover:ring-navy">
                Study in {x.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CTASection title={`Planning to study in ${d.name}?`} text="Speak with an adviser about programmes, documents and timelines for your intake." whatsappMessage={d.whatsappMessage} />
    </>
  );
}
