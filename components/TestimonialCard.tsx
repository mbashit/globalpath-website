import type { Testimonial } from "@/data/testimonials";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-line bg-white p-6">
      <blockquote className="flex-1 leading-relaxed text-ink">“{testimonial.quote}”</blockquote>
      <figcaption className="mt-5 border-t border-line pt-4">
        <span className="block font-semibold text-ink">{testimonial.name}</span>
        <span className="mt-1 block text-sm text-ink-muted">
          {[testimonial.context, testimonial.destination].filter(Boolean).join(" · ")}
        </span>
      </figcaption>
    </figure>
  );
}