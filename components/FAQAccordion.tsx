"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import type { FAQ } from "@/data/faqs";
import { cn } from "@/lib/cn";

export function FAQAccordion({ items, defaultOpen = 0 }: { items: FAQ[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((f, i) => {
        const isOpen = open === i;
        const btnId = `${base}-q-${i}`;
        const panelId = `${base}-a-${i}`;
        return (
          <div key={f.q}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-[1.05rem] font-semibold text-ink hover:text-navy md:px-6"
              >
                {f.q}
                <Plus className={cn("h-5 w-5 shrink-0 text-brandorange transition-transform duration-300", isOpen && "rotate-45")} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={cn("grid transition-[grid-template-rows] duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 leading-relaxed text-ink-muted md:px-6">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
