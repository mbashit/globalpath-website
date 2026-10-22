import { Quote } from "lucide-react";
import { SmartImage } from "./SmartImage";
import type { Testimonial } from "@/data/testimonials";

/**
 * Testimonial card. Unverified entries render with a visible
 * "Placeholder" label so demo content can never pass as real.
 */
export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className={`relative flex h-full flex-col rounded-2xl p-6 ${t.verified ? "bg-white shadow-card ring-1 ring-line" : "border-2 border-dashed border-navy/20 bg-white/60"}`}>
      {!t.verified && (
        <span className="absolute right-4 top-4 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-semibold text-ink">Placeholder</span>
      )}
      <Quote className="h-7 w-7 text-brandorange" aria-hidden="true" />
      <blockquote className={`mt-4 flex-1 text-[1.02rem] leading-relaxed ${t.verified ? "text-ink" : "italic text-ink-faint"}`}>
        {t.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
        {t.photo ? (
          <SmartImage src={t.photo} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-soft font-display font-bold text-navy" aria-hidden="true">
            {t.name.charAt(0)}
          </span>
        )}
        <span className="text-sm">
          <span className="block font-semibold text-ink">{t.name}</span>
          <span className="block text-ink-muted">
            {t.program}, from {t.fromCountry} to {t.destination}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
