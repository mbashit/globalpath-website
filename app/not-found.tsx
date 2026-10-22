import { ButtonLink } from "@/components/Button";

export default function NotFound() {
  return (
    <section className="container flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="font-display text-7xl font-extrabold text-navy/15">404</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-ink">This page isn&apos;t here</h1>
      <p className="mt-3 max-w-md text-ink-muted">The link may be old or mistyped. Start from the homepage or talk to us directly.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Go to the homepage</ButtonLink>
        <ButtonLink href="/contact" variant="outline">Contact us</ButtonLink>
      </div>
    </section>
  );
}
