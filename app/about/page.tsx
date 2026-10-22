import { PageHero } from "@/components/PageHero";
import { Section, SectionHeading } from "@/components/Section";
import { CTASection } from "@/components/CTASection";
import { SmartImage } from "@/components/SmartImage";
import { Icon, type IconName } from "@/components/Icon";
import { images } from "@/data/images";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Us",
  description: `Why we created ${siteConfig.name}: clear, transparent and professional guidance for African students and families planning international study and relocation.`,
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

/*
 * TEAM: replace these placeholders with real team members.
 * Only list people who actually work with the business, with their consent.
 */
const team = [
  { name: "Team member name", role: "Founder / Lead adviser", bio: "Short bio – REPLACE with real background and languages spoken." },
  { name: "Team member name", role: "Admissions adviser", bio: "Short bio – REPLACE." },
  { name: "Team member name", role: "Documentation coordinator", bio: "Short bio – REPLACE." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="Making international education easier to understand"
        intro={`We created ${siteConfig.name} to make international education and relocation easier to understand for students and families across Africa.`}
        crumbs={[{ label: "About Us" }]}
      />

      <Section tone="white">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading title="Our mission" />
            <p className="mt-5 font-display text-2xl font-medium leading-snug text-navy md:text-[1.9rem]">
              To give applicants clear, transparent and professional guidance throughout their international journey.
            </p>
            {/* REPLACE: add the founder's real story – why the business started, who it serves. Do not add years, licences or partnerships unless they can be verified. */}
            <p className="mt-6 leading-relaxed text-ink-muted">
              Applying abroad involves unfamiliar rules, many documents and important financial decisions. Students and parents deserve advice that is accurate, honest about what can and cannot be promised, and delivered by people who understand their situation.
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
        <SectionHeading title="Our team" intro="The people who will guide your application." />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m, i) => (
            <li key={i} className="rounded-2xl border-2 border-dashed border-navy/20 p-6">
              <div className="grid aspect-square w-24 place-items-center rounded-2xl bg-navy-soft text-navy" aria-hidden="true">
                <Icon name="users" className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">{m.name}</h3>
              <p className="text-sm font-semibold text-brandorange-dark">{m.role}</p>
              <p className="mt-2 text-ink-muted">{m.bio}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CTASection title="Let's talk about your plans" />
    </>
  );
}
