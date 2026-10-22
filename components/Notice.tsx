import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "integrity";

const tones: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: "border-navy/15 bg-navy-soft text-navy-deep", Icon: Info },
  warning: { box: "border-[#E4572E]/30 bg-[#FFF1EC] text-[#7A2410]", Icon: AlertTriangle },
  integrity: { box: "border-gold bg-gold-soft text-ink", Icon: ShieldCheck },
};

/** Compliance / information callout. */
export function Notice({ children, tone = "info", title, className }: { children: React.ReactNode; tone?: Tone; title?: string; className?: string }) {
  const { box, Icon } = tones[tone];
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 md:p-5", box, className)} role={tone === "warning" ? "note" : undefined}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="text-[0.95rem] leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
