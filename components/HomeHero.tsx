"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "./Button";
import { SmartImage } from "./SmartImage";
import { images } from "@/data/images";
import { cn } from "@/lib/cn";

// Example routes shown on the boarding pass. Edit freely.
const routes = [
  { from: "LOS", fromCity: "Lagos", to: "BER", toCity: "Berlin", country: "Germany" },
  { from: "ACC", fromCity: "Accra", to: "YYZ", toCity: "Toronto", country: "Canada" },
  { from: "ABV", fromCity: "Abuja", to: "MAN", toCity: "Manchester", country: "United Kingdom" },
  { from: "NBO", fromCity: "Nairobi", to: "BOS", toCity: "Boston", country: "United States" },
  { from: "PHC", fromCity: "Port Harcourt", to: "KZN", toCity: "Kazan", country: "Russia" },
];

const checklist = ["Consultation", "Admission", "Visa documents", "Departure"];

export function HomeHero() {
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setI((n) => (n + 1) % routes.length);
        setFade(true);
      }, 250);
    }, 3400);
    return () => clearInterval(t);
  }, []);

  const r = routes[i];

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* soft light + flight arcs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 top-[-20%] h-[520px] w-[520px] rounded-full bg-[#3A41B0] blur-3xl opacity-60" />
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
          <path d="M-20 640 C 300 600, 520 420, 700 260 S 1000 60, 1240 40" fill="none" stroke="#FDBE18" strokeWidth="1.5" strokeDasharray="3 11" />
        </svg>
      </div>

      <div className="container relative grid gap-12 pb-20 pt-12 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="animate-rise">
          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[3.4rem] lg:text-[4.1rem]">
            Your journey abroad starts with the right guidance.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            We help students, professionals and families navigate international education, documentation, visa preparation and relocation with confidence.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/book-consultation">Start Your Application</ButtonLink>
            <ButtonLink href="/services" variant="ghostLight">Explore Our Services</ButtonLink>
          </div>
        </div>

        {/* Photo + boarding pass */}
        <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
          <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[2rem] bg-navy-deep ring-1 ring-white/15 sm:w-[78%]">
            <SmartImage src={images.hero.src} alt={images.hero.alt} fill priority sizes="(max-width: 1024px) 80vw, 420px" className="object-cover" />
          </div>

          <div
            className="absolute -bottom-8 left-0 w-[88%] max-w-[380px] rounded-3xl bg-white text-ink shadow-lift sm:-bottom-10"
            aria-live="polite"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="text-sm font-semibold text-navy">Study route</span>
              <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-semibold text-ink">Example</span>
            </div>
            <div className={cn("flex items-end justify-between gap-3 px-5 pb-4 pt-3 transition-opacity duration-300", fade ? "opacity-100" : "opacity-0")}>
              <div>
                <p className="font-display text-[2.3rem] font-extrabold leading-none text-navy">{r.from}</p>
                <p className="mt-1 text-sm text-ink-muted">{r.fromCity}</p>
              </div>
              <svg viewBox="0 0 80 24" className="mb-5 h-6 w-16 shrink-0 text-brandorange" aria-hidden="true">
                <path d="M2 18 C 25 2, 55 2, 72 12" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 5" />
                <path d="M70 6l8 7-10 2z" fill="currentColor" />
              </svg>
              <div className="text-right">
                <p className="font-display text-[2.3rem] font-extrabold leading-none text-navy">{r.to}</p>
                <p className="mt-1 text-sm text-ink-muted">{r.toCity}, {r.country}</p>
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
                  <span className={cn("mx-auto grid h-7 w-7 place-items-center rounded-full text-[0.7rem] font-bold", idx < 3 ? "bg-navy text-gold" : "border-2 border-dashed border-navy/30 text-navy")}>
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
