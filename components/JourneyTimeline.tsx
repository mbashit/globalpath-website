import { Plane } from "lucide-react";

const stops = [
  { label: "Africa", note: "Where your plan begins" },
  { label: "Consultation", note: "Goals, budget and options" },
  { label: "Admission", note: "Applications and offer" },
  { label: "Visa preparation", note: "Documents and interview" },
  { label: "Travel", note: "Pre-departure checklist" },
  { label: "Your new campus", note: "Arrival and registration" },
];

/** The client journey drawn as a flight path. */
export function JourneyTimeline() {
  return (
    <div className="relative">
      {/* Desktop: flight path */}
      <div className="relative hidden lg:block">
        <svg viewBox="0 0 1000 120" className="h-28 w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M40 90 C 220 90, 260 20, 500 30 S 800 100, 960 30" fill="none" stroke="rgba(253,190,24,.55)" strokeWidth="2.5" strokeDasharray="4 10" strokeLinecap="round" />
        </svg>
        <Plane className="absolute right-[1.5%] top-1 h-8 w-8 rotate-[-20deg] text-gold" aria-hidden="true" />
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:-mt-6 lg:grid-cols-6 lg:gap-3">
        {stops.map((s, i) => (
          <li key={s.label} className="flex items-start gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 lg:flex-col lg:gap-3 lg:bg-transparent lg:p-0 lg:ring-0">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${i === stops.length - 1 ? "bg-gold text-navy-ink" : "bg-white text-navy"}`}>
              {i + 1}
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">{s.label}</p>
              <p className="text-sm text-white/65">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
