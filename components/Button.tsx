import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "navy" | "outline" | "ghostLight" | "whatsapp";

const styles: Record<Variant, string> = {
  primary: "bg-brandorange text-navy-ink hover:bg-gold",
  navy: "bg-navy text-white hover:bg-navy-deep",
  outline: "border-2 border-navy/15 text-navy hover:border-navy hover:bg-navy-soft",
  ghostLight: "border-2 border-white/30 text-white hover:border-white hover:bg-white/10",
  whatsapp: "bg-[#1FAF55] text-white hover:bg-[#178a43]",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
}) {
  const cls = cn(
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.97rem] font-semibold transition-colors duration-200",
    styles[variant],
    className
  );
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
