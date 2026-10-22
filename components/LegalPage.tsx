import { PageHero } from "./PageHero";
import { siteConfig } from "@/data/site";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} crumbs={[{ label: title }]} intro={`Last updated: ${siteConfig.lastLegalUpdate}`} />
      <section className="bg-white py-14 md:py-20">
        <div className="container">
          {/* TEMPLATE TEXT – have this reviewed by a qualified lawyer in the country where the business is registered before launch. */}
          <div className="prose-gp mx-auto max-w-3xl">{children}</div>
        </div>
      </section>
    </>
  );
}
