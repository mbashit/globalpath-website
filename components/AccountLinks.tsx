"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { isPortalConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!isPortalConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

/**
 * Compact account button for the desktop header, sized like the WhatsApp
 * button so the existing navigation keeps its layout. Opens a small
 * "Log in | Create account" menu, or links to the portal once signed in.
 */
export function AccountLinks({ className }: { className?: string }) {
  const signedIn = useSignedIn();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu after navigation
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const circle = "grid h-11 w-11 place-items-center rounded-full border border-line text-navy transition-colors hover:bg-navy-soft";

  if (signedIn) {
    return (
      <div className={cn("relative", className)}>
        <Link href="/portal" aria-label="My student portal" title="My student portal" className={circle}>
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </Link>
        <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1FAF55]" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" aria-label="Student account" aria-expanded={open} aria-controls="account-menu" title="Log in or create an account" onClick={() => setOpen((v) => !v)} className={circle}>
        <UserRound className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        id="account-menu"
        className={cn(
          "absolute right-0 top-full mt-2 w-[240px] rounded-2xl border border-line bg-white p-2 shadow-lift transition-all",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        )}
      >
        <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Student portal</p>
        <Link href="/login" className="block rounded-xl px-4 py-2.5 font-semibold text-ink hover:bg-canvas">Log in</Link>
        <Link href="/signup" className="block rounded-xl px-4 py-2.5 font-semibold text-ink hover:bg-canvas">Create account</Link>
      </div>
    </div>
  );
}

export function MobileAccountLinks() {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <Link href="/portal" className="flex min-h-[52px] items-center justify-center rounded-full bg-navy font-semibold text-white">
        My student portal
      </Link>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/login" className="flex min-h-[48px] items-center justify-center rounded-full border-2 border-navy/15 font-semibold text-navy">Log in</Link>
      <Link href="/signup" className="flex min-h-[48px] items-center justify-center rounded-full border-2 border-navy/15 font-semibold text-navy">Create account</Link>
    </div>
  );
}
