import type { Testimonial } from "@/data/testimonials";
import Image from "next/image";
import { MapPin, Quote } from "lucide-react";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl bg-white p-7 shadow-card ring-1 ring-line">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-soft text-brandorange-dark">
          <Quote className="h-5 w-5 fill-current" aria-hidden="true" />
        </span>
        {testimonial.destination && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-soft px-3 py-1 text-xs font-semibold text-navy">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {testimonial.destination}
          </span>
        )}
      </div>
      <blockquote className="mt-5 flex-1 leading-relaxed text-ink">“{testimonial.quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-4 border-t border-line pt-5">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-gold ring-offset-2">
          <Image src={testimonial.image} alt={testimonial.imageAlt} fill sizes="56px" className="object-cover" />
        </span>
        <span>
          <span className="block font-display font-semibold text-ink">{testimonial.name}</span>
          <span className="mt-0.5 block text-sm text-ink-muted">{testimonial.context}</span>
        </span>
      </figcaption>
    </figure>
  );
}
