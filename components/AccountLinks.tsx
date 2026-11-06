"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { isPortalConfigured } from "@/lib/supabase/config";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/cn";

export type Account = { status: "visitor" } | { status: "signed-in"; firstName: string; staff: boolean };

/** Supabase keeps the session in sb-<project>-auth-token cookies (possibly chunked .0/.1). */
export const AUTH_COOKIE_RE = /(?:^|;\s*)sb-[^=]*-auth-token/;

/**
 * Inline <head> script: when a session cookie exists, hide the visitor links
 * until the account is confirmed, so signed-in students never see a flash
 * of "Log in | Create Account". Visitors get their links on first paint.
 */
export const authPendingScript = `try{if(${AUTH_COOKIE_RE}.test(document.cookie))document.documentElement.dataset.auth="pending"}catch(e){}`;

function settle() {
  delete document.documentElement.dataset.auth;
}

/**
 * Account state for the public header. The session is checked on the server
 * (/api/portal/me verifies it with Supabase Auth); the cookie test only
 * avoids a request for visitors. Re-checked after each navigation so
 * signing in or out elsewhere is picked up.
 */
export function useAccount(): Account {
  const pathname = usePathname();
  const [account, setAccount] = useState<Account>({ status: "visitor" });

  useEffect(() => {
    if (!isPortalConfigured) return;
    if (!AUTH_COOKIE_RE.test(document.cookie)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- signed out elsewhere (no session cookie left)
      setAccount({ status: "visitor" });
      settle();
      return;
    }
    let cancelled = false;
    fetch("/api/portal/me", { cache: "no-store", signal: AbortSignal.timeout(6_000) })
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { signedIn?: boolean; firstName?: string; staff?: boolean } | null) => {
        if (cancelled) return;
        setAccount(me?.signedIn ? { status: "signed-in", firstName: me.firstName ?? "", staff: Boolean(me.staff) } : { status: "visitor" });
      })
      .catch(() => !cancelled && setAccount({ status: "visitor" }))
      .finally(() => !cancelled && settle());
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return account;
}

export const accountMenu = [
  { label: "My Profile", href: "/portal/profile" },
  { label: "My Documents", href: "/portal/documents" },
  { label: "My Applications", href: "/portal/applications" },
  { label: "Verification Status", href: "/portal/verification" },
  { label: "Account Settings", href: "/portal/settings" },
];

const textLink = "inline-flex min-h-[44px] items-center rounded-full px-3 text-[0.93rem] font-semibold text-navy transition-colors hover:bg-navy-soft";
const primary = "inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-navy px-5 text-[0.93rem] font-semibold text-white transition-colors hover:bg-navy-ink";

/** Header account actions: "Log in | Create Account", or "Dashboard | My Account" once signed in. */
export function AccountLinks({ account }: { account: Account }) {
  const pathname = usePathname();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu after navigation
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isPortalConfigured) return null;

  if (account.status === "visitor") {
    return (
      <div className="account-guest flex items-center gap-1">
        <Link href="/login" className={textLink}>Log in</Link>
        <Link href="/signup" className={cn(primary, "hidden md:inline-flex")}>Create Account</Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Below 360px there is no room; "Go to Dashboard" leads the mobile menu instead. */}
      <Link href="/portal" className={cn(textLink, "max-[359px]:hidden")}>Dashboard</Link>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(primary, "hidden gap-1.5 md:inline-flex")}
      >
        My Account
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div
        id={menuId}
        className={cn(
          "absolute right-0 top-full mt-2 w-[250px] rounded-2xl border border-line bg-white p-2 shadow-lift transition-[opacity,transform,visibility] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        )}
      >
        {account.firstName && <p className="truncate px-4 pb-1 pt-2 text-sm text-ink-muted">Signed in as {account.firstName}</p>}
        <ul>
          {accountMenu.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded-xl px-4 py-2.5 font-semibold text-ink hover:bg-canvas">{item.label}</Link>
            </li>
          ))}
          {account.staff && (
            <li>
              <Link href="/admin" className="block rounded-xl px-4 py-2.5 font-semibold text-navy hover:bg-canvas">Staff dashboard</Link>
            </li>
          )}
        </ul>
        <form action={signOutAction} className="mt-1 border-t border-line pt-1">
          <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left font-semibold text-[#9A2E14] hover:bg-[#FFF1EC]">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

/** Account actions at the top of the mobile menu. */
export function MobileAccountLinks({ account }: { account: Account }) {
  if (!isPortalConfigured) return null;

  if (account.status === "visitor") {
    return (
      <div className="account-guest grid gap-3 pb-2 pt-5">
        <p className="text-sm font-medium text-ink-faint">Student portal</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/signup" className="flex min-h-[52px] items-center justify-center rounded-full bg-navy px-3 text-center font-semibold text-white">Create Account</Link>
          <Link href="/login" className="flex min-h-[52px] items-center justify-center rounded-full border-2 border-navy/15 px-3 font-semibold text-navy">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 pb-2 pt-5">
      <p className="text-sm font-medium text-ink-faint">
        My account{account.firstName ? ` · ${account.firstName}` : ""}
      </p>
      <Link href="/portal" className="flex min-h-[52px] items-center justify-center rounded-full bg-navy font-semibold text-white">Go to Dashboard</Link>
      <ul className="grid grid-cols-2 gap-x-3">
        {accountMenu.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex min-h-[44px] items-center text-ink-muted hover:text-navy">{item.label}</Link>
          </li>
        ))}
        {account.staff && (
          <li>
            <Link href="/admin" className="flex min-h-[44px] items-center font-semibold text-navy">Staff dashboard</Link>
          </li>
        )}
      </ul>
      <form action={signOutAction}>
        <button type="submit" className="flex min-h-[44px] items-center gap-2 font-semibold text-[#9A2E14]">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign Out
        </button>
      </form>
    </div>
  );
}
