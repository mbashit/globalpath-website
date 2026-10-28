import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Alert } from "./ui";
import { isPortalConfigured } from "@/lib/supabase/config";

/** Centered card used by login, sign-up and password pages (inside the public site layout). */
export function AuthShell({ title, intro, children, aside }: { title: string; intro?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="bg-canvas py-12 md:py-20">
      <div className="container grid max-w-5xl items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line md:p-10">
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          {intro && <div className="mt-2 text-ink-muted">{intro}</div>}
          {!isPortalConfigured && (
            <Alert tone="warn" className="mt-6" title="Student portal not yet available">
              Accounts cannot be created or used until GlobalPath finishes setting up the portal. You can still{" "}
              <Link href="/book-consultation" className="font-semibold underline">request a consultation</Link>.
            </Alert>
          )}
          <div className="mt-8">{children}</div>
        </div>
        <aside className="rounded-3xl bg-navy p-6 text-white md:p-8">
          {aside ?? (
            <>
              <ShieldCheck className="h-8 w-8 text-gold" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold">Your GlobalPath student portal</h2>
              <ul className="mt-4 space-y-3 text-white/80">
                <li>Keep your profile and academic history in one place.</li>
                <li>Upload certificates once and reuse them across applications.</li>
                <li>Track GlobalPath&apos;s internal document review and application preparation.</li>
              </ul>
              <p className="mt-6 text-sm text-white/60">
                GlobalPath reviews documents for completeness as part of its consultancy service. This is not university admission or certification by
                uni-assist, universities or government authorities.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
