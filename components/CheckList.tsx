import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function CheckList({ items, light = false, className }: { items: string[]; light?: boolean; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((it) => (
        <li key={it} className="flex gap-3">
          <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", light ? "bg-gold text-navy-ink" : "bg-navy-soft text-navy")}>
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className={light ? "text-white/85" : "text-ink-muted"}>{it}</span>
        </li>
      ))}
    </ul>
  );
}
