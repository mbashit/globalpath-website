import { ButtonLink } from "./Button";
import { SmartImage } from "./SmartImage";
import { images } from "@/data/images";
import { cn } from "@/lib/cn";

type Photo = { src: string; alt: string };

const route = { from: "LOS", fromCity: "Lagos", to: "BER", toCity: "Berlin", country: "Germany" };

const checklist = ["Consultation", "Admission", "Visa documents", "Departure"];

export function HomeHero({ image = images.hero }: { image?: Photo }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* flight arc */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
          <path d="M-20 640 C 300 600, 520 420, 700 260 S 1000 60, 1240 40" fill="none" stroke="#FDBE18" strokeWidth="1.5" strokeDasharray="3 11" />
        </svg>
      </div>

      <div className="container relative grid gap-12 pb-20 pt-12 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="animate-rise">
          <h1 className="font-display text-[2.45rem] font-semibold leading-[1.06] tracking-[-0.02em] sm:text-[3.25rem] lg:text-[4rem] lg:tracking-[-0.03em]">
            Study abroad, with a clearer path
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            GlobalPath helps students and families understand university applications, document preparation and visa steps for study destinations across Europe and beyond.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/book-consultation">Request a Consultation</ButtonLink>
            <ButtonLink href="/services" variant="ghostLight">Explore our services</ButtonLink>
          </div>
        </div>

        {/* Photo + boarding pass */}
        <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
          <div className="relative ml-auto aspect-[4/3] w-[82%] overflow-hidden rounded-[2rem] bg-navy-deep ring-1 ring-white/15 sm:aspect-[4/5] sm:w-[78%]">
            <SmartImage src={image.src} alt={image.alt} fill priority sizes="(max-width: 1024px) 80vw, 420px" className="object-cover" />
          </div>

          <div
            className="absolute bottom-2 left-0 w-[88%] max-w-[380px] rounded-3xl bg-white text-ink shadow-lift sm:-bottom-10"
            aria-label=" study route"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="text-sm font-semibold text-navy">Illustrative study route</span>
              <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-semibold text-ink">client story</span>
            </div>
            <div className="flex items-end justify-between gap-3 px-5 pb-4 pt-3">
              <div>
                <p className="font-display text-[2.3rem] font-semibold leading-none text-navy">{route.from}</p>
                <p className="mt-1 text-sm text-ink-muted">{route.fromCity}</p>
              </div>
              <svg viewBox="0 0 80 24" className="mb-5 h-6 w-16 shrink-0 text-brandorange" aria-hidden="true">
                <path d="M2 18 C 25 2, 55 2, 72 12" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 5" />
                <path d="M70 6l8 7-10 2z" fill="currentColor" />
              </svg>
              <div className="text-right">
                <p className="font-display text-[2.3rem] font-semibold leading-none text-navy">{route.to}</p>
                <p className="mt-1 text-sm text-ink-muted">{route.toCity}, {route.country}</p>
              </div>
            </div>
            {/* perforation */}
            <div className="relative mx-0 h-0 border-t-2 border-dashed border-line">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-navy" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-navy" />
            </div>
            <ol className="grid grid-cols-4 gap-1 px-4 py-4">
              {checklist.map((c, idx) => (
                <li key={c} className="text-center">
                  <span className={cn("mx-auto grid h-7 w-7 place-items-center rounded-full text-[0.7rem] font-semibold tabular-nums", idx < 3 ? "bg-navy text-gold" : "border-2 border-dashed border-navy/30 text-navy")}>
                    {idx + 1}
                  </span>
                  <span className="mt-1.5 block text-[0.7rem] leading-tight text-ink-muted">{c}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
