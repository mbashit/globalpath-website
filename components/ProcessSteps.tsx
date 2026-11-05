export type Step = { title: string; text: string };

export const defaultSteps: Step[] = [
  { title: "Consultation", text: "Tell us your preferred country, course, budget and goals." },
  { title: "Eligibility review", text: "We review your academic profile and documentation." },
  { title: "Application preparation", text: "Our team helps organise and prepare your applications." },
  { title: "Submission & visa support", text: "We guide you through admission and visa documentation." },
  { title: "Pre-departure support", text: "Get help booking your flight, finding accommodation and preparing to travel." },
];

/** Numbered, connected steps: horizontal on desktop, vertical on mobile. */
export function ProcessSteps({ steps = defaultSteps }: { steps?: Step[] }) {
  return (
    <ol className="relative grid gap-0 lg:grid-cols-5 lg:gap-6">
      {/* connector line (desktop) */}
      <span className="absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-navy/20 lg:block" aria-hidden="true" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-5 pb-10 last:pb-0 lg:flex-col lg:gap-0 lg:pb-0">
          {/* connector line (mobile) */}
          {i < steps.length - 1 && <span className="absolute bottom-0 left-7 top-14 border-l-2 border-dashed border-navy/20 lg:hidden" aria-hidden="true" />}
          <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-navy font-display text-lg font-bold text-gold ring-8 ring-white">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="lg:mt-6">
            <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
