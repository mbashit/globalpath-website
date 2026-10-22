import { cn } from "@/lib/cn";

export function Section({
  id,
  children,
  className,
  tone = "white",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "white" | "canvas" | "navy";
}) {
  const tones = { white: "bg-white", canvas: "bg-canvas", navy: "bg-navy text-white" };
  return (
    <section id={id} className={cn("scroll-mt-24 py-16 md:py-24", tones[tone], className)}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  intro,
  align = "left",
  light = false,
  as: Tag = "h2",
}: {
  title: string;
  intro?: string;
  align?: "left" | "center";
  light?: boolean;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <Tag className={cn("font-display text-[1.9rem] font-bold leading-[1.1] md:text-[2.6rem]", light ? "text-white" : "text-ink")}>
        {title}
      </Tag>
      {intro && <p className={cn("mt-4 text-lg", light ? "text-white/75" : "text-ink-muted")}>{intro}</p>}
    </div>
  );
}
