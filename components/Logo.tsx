import Link from "next/link";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/cn";

/** Placeholder text logo. Replace the SVG mark with the final logo file when available. */
export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${siteConfig.name} – home`}>
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill={inverted ? "#FFFFFF" : "#252B83"} />
        {/* a path that curves from bottom-left to a point: the "path abroad" */}
        <path d="M9 29c6-1 9-5 11-10s5-8 11-9" fill="none" stroke="#F7941D" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="9" cy="29" r="2.6" fill={inverted ? "#252B83" : "#FFFFFF"} />
        <path d="M28.5 7.5l4.5 2.4-3.6 3.6z" fill="#FDBE18" />
      </svg>
      <span className="leading-none">
        <span className={cn("block font-display text-[1.2rem] font-bold tracking-tight", inverted ? "text-white" : "text-navy")}>
          {siteConfig.shortName}
        </span>
        <span className={cn("mt-0.5 block text-[0.72rem] font-medium", inverted ? "text-white/70" : "text-ink-muted")}>
          {siteConfig.logoSubline}
        </span>
      </span>
    </Link>
  );
}
