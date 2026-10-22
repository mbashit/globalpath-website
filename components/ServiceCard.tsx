import Link from "next/link";
import { Icon } from "./Icon";
import type { ServiceSummary } from "@/data/services";

export function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-[border-color,box-shadow] hover:border-navy/25 hover:shadow-card">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-soft text-navy transition-colors group-hover:bg-navy group-hover:text-gold">
        <Icon name={service.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-ink">{service.title}</h3>
      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-ink-muted">{service.summary}</p>
      <Link href={service.href} className="mt-5 inline-flex min-h-[40px] items-center font-semibold text-navy underline decoration-brandorange decoration-2 underline-offset-[6px] after:absolute after:inset-0 after:rounded-2xl hover:decoration-navy">
        Learn more<span className="sr-only"> about {service.title}</span>
      </Link>
    </article>
  );
}
