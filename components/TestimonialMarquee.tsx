import { TestimonialCard } from "@/components/TestimonialCard";
import type { Testimonial } from "@/data/testimonials";

// Three copies keep the track wider than the screen while the `marquee` keyframe shifts it by one copy.
const COPIES = 3;

export function TestimonialMarquee({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section
      aria-label="Client testimonials"
      className="group relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto"
    >
      <ul className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
        {Array.from({ length: COPIES }, (_, copy) =>
          testimonials.map((testimonial) => (
            <li
              key={`${copy}-${testimonial.id}`}
              aria-hidden={copy > 0 || undefined}
              className={`w-[320px] shrink-0 pr-6 sm:w-[400px] ${copy > 0 ? "motion-reduce:hidden" : ""}`}
            >
              <TestimonialCard testimonial={testimonial} />
            </li>
          )),
        )}
      </ul>
    </section>
  );
}
