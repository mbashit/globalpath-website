import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/portal/constants";

/** Building blocks for the portal and admin screens, using the site's brand tokens. */

const toneClasses: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-muted ring-line",
  info: "bg-navy-soft text-navy ring-navy/15",
  warn: "bg-gold-soft text-[#7A4B00] ring-gold/50",
  success: "bg-[#EFFAF3] text-[#11643A] ring-[#1FAF55]/30",
  danger: "bg-[#FFF1EC] text-[#9A2E14] ring-[#C8341B]/25",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", toneClasses[tone], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

export function StatusBadge<T extends string>({ status, map }: { status: T; map: Record<T, { label: string; tone: Tone }> }) {
  const s = map[status] ?? { label: status, tone: "neutral" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PageHeader({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        {intro && <p className="mt-1.5 max-w-2xl text-ink-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, className, actions, id }: { title?: string; description?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-2xl bg-white p-5 shadow-card ring-1 ring-line md:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="block text-sm font-medium text-ink-muted">{label}</span>
      <span className="mt-1 block font-display text-3xl font-bold text-navy">{value}</span>
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </>
  );
  const cls = "block rounded-2xl bg-white p-5 shadow-card ring-1 ring-line";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-lift")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-canvas/60 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children: ReactNode; className?: string }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? XCircle : tone === "warn" ? AlertTriangle : Info;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl p-4 text-[0.95rem] ring-1", toneClasses[tone], className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5")}>{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-semibold text-navy">{value}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-navy-soft" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-brandorange transition-[width]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export const inputClass =
  "mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-navy focus:outline-none focus:ring-4 focus:ring-navy/10 disabled:bg-canvas aria-[invalid=true]:border-[#C8341B]";

export const labelClass = "text-sm font-semibold text-ink";

export const buttonClass = {
  primary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-brandorange px-5 font-semibold text-navy-ink transition-colors hover:bg-gold disabled:opacity-60",
  secondary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-navy/15 bg-white px-5 font-semibold text-navy transition-colors hover:border-navy/40 disabled:opacity-60",
  navy: "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-navy px-5 font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-60",
  danger:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-[#C8341B]/30 bg-white px-5 font-semibold text-[#9A2E14] transition-colors hover:bg-[#FFF1EC] disabled:opacity-60",
  link: "font-semibold text-navy underline underline-offset-2 hover:text-navy-deep",
};

export function Field({
  label,
  name,
  hint,
  error,
  optional,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string; error?: string; optional?: boolean }) {
  const id = props.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="font-normal text-ink-faint"> (optional)</span>}
      </label>
      <input id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={inputClass} {...props} />
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-sm text-ink-faint">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-sm font-medium text-[#C8341B]">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  optional,
  placeholder = "Select…",
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; options: { value: string; label: string }[]; optional?: boolean; placeholder?: string }) {
  const id = props.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="font-normal text-ink-faint"> (optional)</span>}
      </label>
      <select id={id} name={name} className={inputClass} {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextAreaField({ label, name, optional, hint, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; optional?: boolean; hint?: string }) {
  const id = props.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="font-normal text-ink-faint"> (optional)</span>}
      </label>
      <textarea id={id} name={name} rows={4} className={inputClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-ink-faint">{hint}</p>}
    </div>
  );
}

/** Horizontally scrollable table wrapper for narrow screens. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">{children}</div>;
}
export const thClass = "border-b border-line px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint";
export const tdClass = "border-b border-line px-3 py-3 align-top text-sm text-ink";
