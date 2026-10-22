import type { Testimonial } from "@/data/testimonials";
import Image from "next/image";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="grid h-full overflow-hidden rounded-xl border border-line bg-white md:grid-cols-[0.9fr_1.1fr]">
      <div className="relative aspect-[4/3] md:aspect-auto">
        <Image src={testimonial.image} alt={testimonial.imageAlt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
      </div>
      <div className="flex min-h-[250px] flex-col p-6">
        <blockquote className="flex-1 leading-relaxed text-ink">“{testimonial.quote}”</blockquote>
        <figcaption className="mt-5 border-t border-line pt-4">
          <span className="block font-semibold text-ink">{testimonial.name}</span>
          <span className="mt-1 block text-sm text-ink-muted">
            {[testimonial.context, testimonial.destination].filter(Boolean).join(" · ")}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}