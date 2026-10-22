"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TestimonialCard } from "@/components/TestimonialCard";
import type { Testimonial } from "@/data/testimonials";

const AUTOPLAY_MS = 6000;

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count, activeIndex]);

  if (count === 0) return null;

  const goTo = (index: number) => setActiveIndex((index + count) % count);

  return (
    <section
      aria-label="Client testimonials"
      className="overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm font-medium text-ink-muted">
          {activeIndex + 1} / {count}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous testimonial"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-navy transition-colors hover:bg-canvas focus-visible:outline-offset-2"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next testimonial"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-navy transition-colors hover:bg-canvas focus-visible:outline-offset-2"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} aria-hidden={index !== activeIndex} className="w-full shrink-0 px-0.5">
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2" aria-label="Choose testimonial">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show testimonial ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${index === activeIndex ? "bg-navy" : "bg-line hover:bg-ink-faint"}`}
          />
        ))}
      </div>
    </section>
  );
}