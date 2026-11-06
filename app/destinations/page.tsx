import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { CountryCard } from "@/components/CountryCard";
import { Notice } from "@/components/Notice";
import { CTASection } from "@/components/CTASection";
import { ButtonLink } from "@/components/Button";
import { getDestinations } from "@/lib/site-content";
import { requirementsChangeNotice } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Study Destinations: Germany, Canada, UK, USA and Russia",
  description:
    "Compare study destinations for Nigerian and African students: programmes, application steps, financial requirements and student visas for Germany, Canada, the UK, the USA and Russia.",
  path: "/destinations",
  keywords: ["study in Germany from Nigeria", "study in Russia from Nigeria", "Canada study visa support", "UK student visa Nigeria"],
});

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  return (
    <>
      <PageHero
        title="Choose the right study destination"
        intro="Each country has different costs, entry routes and visa rules. Start with an overview, then open a country for the full picture."
        crumbs={[{ label: "Destinations" }]}
      >
        <ButtonLink href="/book-consultation">Talk to an Adviser</ButtonLink>
      </PageHero>

      <Section tone="canvas">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d, i) => (
            <CountryCard key={d.slug} d={d} priority={i < 3} />
          ))}
          <div className="flex flex-col justify-between rounded-xl3 border-2 border-dashed border-navy/20 p-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Considering another country?</h2>
              <p className="mt-3 text-ink-muted">Tell us where you would like to study. We will let you know honestly whether we can support that destination.</p>
            </div>
            <ButtonLink href="/contact" variant="outline" className="mt-6 w-fit">Ask about a destination</ButtonLink>
          </div>
        </div>
        <Notice className="mt-10">{requirementsChangeNotice}</Notice>
      </Section>

      <Section tone="white">
        <SectionHeading title="At a glance" intro="A quick comparison of how each destination works. Open a country page for the detail." />
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[720px] text-left text-[0.95rem]">
            <caption className="sr-only">Comparison of study destinations</caption>
            <thead className="bg-canvas">
              <tr>
                <th scope="col" className="p-4 font-display font-semibold text-ink">Country</th>
                <th scope="col" className="p-4 font-display font-semibold text-ink">In short</th>
                <th scope="col" className="p-4 font-display font-semibold text-ink">Typical visa route</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => (
                <tr key={d.slug} className="border-t border-line align-top">
                  <th scope="row" className="p-4 font-semibold text-navy">
                    <Link href={`/destinations/${d.slug}`} className="underline decoration-brandorange underline-offset-4">{d.name}</Link>
                  </th>
                  <td className="p-4 text-ink-muted">{d.intro}</td>
                  <td className="p-4 text-ink-muted">{d.visaOverview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <CTASection title="Not sure which country fits you?" text="Share your grades, budget and goals. We will explain which destinations are realistic and why." />
    </>
  );
}
