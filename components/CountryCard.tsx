import Link from "next/link";
import { SmartImage } from "./SmartImage";
import type { Destination } from "@/data/destinations";

export function CountryCard({ d, priority = false }: { d: Destination; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl3 bg-white shadow-card ring-1 ring-line">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        <SmartImage
          src={d.image}
          alt={d.imageAlt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-navy" style={{ boxShadow: `inset 0 -3px 0 ${d.accent}` }}>
          {d.code}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-bold text-ink">{d.name}</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">{d.intro}</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Study options in ${d.name}`}>
          {d.studyOptions.slice(0, 3).map((o) => (
            <li key={o} className="rounded-full bg-canvas px-3 py-1 text-[0.8rem] text-ink-muted ring-1 ring-line">{o}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-faint">Admission, visa-document, flight and accommodation support available.</p>
        <Link
          href={`/destinations/${d.slug}`}
          className="mt-5 inline-flex min-h-[44px] w-fit items-center rounded-full bg-navy px-5 font-semibold text-white transition-colors after:absolute after:inset-0 hover:bg-navy-deep"
        >
          Explore {d.shortName}
        </Link>
      </div>
    </article>
  );
}
