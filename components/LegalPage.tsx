import { PageHero } from "./PageHero";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} crumbs={[{ label: title }]} intro="" />
      <section className="bg-white py-14 md:py-20">
        <div className="container">
          <div className="prose-gp mx-auto max-w-3xl">{children}</div>
        </div>
      </section>
    </>
  );
}
