import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/** Hero for inner pages: navy band with breadcrumb, title, short intro and optional actions. */
export function PageHero({
  title,
  intro,
  crumbs,
  children,
  aside,
}: {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <svg className="pointer-events-none absolute -right-24 -top-10 h-[420px] w-[620px] opacity-[0.16]" viewBox="0 0 620 420" aria-hidden="true">
        <path d="M10 400C160 380 250 300 320 200S470 40 610 20" fill="none" stroke="#FDBE18" strokeWidth="2" strokeDasharray="6 10" />
        <path d="M60 420C200 390 300 330 380 240S520 90 620 80" fill="none" stroke="#F7941D" strokeWidth="2" strokeDasharray="2 12" />
      </svg>
      <div className="container relative grid gap-10 py-14 md:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <Breadcrumbs items={crumbs} light />
          <h1 className="mt-6 max-w-3xl font-display text-[2.3rem] font-bold leading-[1.05] md:text-[3.4rem]">{title}</h1>
          {intro && <p className="mt-5 max-w-2xl text-lg text-white/80">{intro}</p>}
          {children && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{children}</div>}
        </div>
        {aside && <div>{aside}</div>}
      </div>
    </section>
  );
}
