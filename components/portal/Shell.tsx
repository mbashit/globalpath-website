"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  FileStack,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  School,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/cn";

const icons = {
  dashboard: LayoutDashboard,
  profile: UserRound,
  education: GraduationCap,
  universities: School,
  applications: FileStack,
  documents: FolderOpen,
  verification: FileCheck2,
  notifications: Bell,
  consultations: CalendarCheck,
  settings: Settings,
  students: Users,
  reviews: ClipboardCheck,
  staff: ShieldCheck,
  requirements: ListChecks,
  guide: BookOpen,
};
export type ShellIcon = keyof typeof icons;
export type ShellNavItem = { label: string; href: string; icon: ShellIcon; badge?: number };

export function Shell({
  nav,
  area,
  userName,
  subtitle,
  switchLink,
  children,
}: {
  nav: ShellNavItem[];
  area: string;
  userName: string;
  subtitle: string;
  switchLink?: { label: string; href: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    startTransition(() => setOpen(false));
  }, [pathname]);

  const isActive = (href: string) => (href === "/portal" || href === "/admin" ? pathname === href : pathname?.startsWith(href));

  const sidebar = (
    <nav aria-label={area} className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5">
        <Logo />
        <p className="mt-3 text-sm font-medium text-ink-faint">{area}</p>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {nav.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 text-[0.93rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30",
                  active ? "bg-navy-soft text-navy ring-1 ring-inset ring-navy/10" : "text-ink-muted hover:bg-canvas hover:text-ink"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-navy" : "text-ink-faint")} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate" title={item.label}>{item.label}</span>
                {item.badge ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-navy">
                    <span className="h-1.5 w-1.5 rounded-full bg-brandorange" aria-hidden="true" />
                    {item.badge}
                    <span className="sr-only"> new</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line px-5 py-4">
        <p className="truncate font-semibold text-ink">{userName}</p>
        <p className="truncate text-sm text-ink-muted">{subtitle}</p>
        <div className="-mx-3 mt-3 grid gap-1">
          {switchLink && (
            <Link href={switchLink.href} className="flex min-h-[36px] items-center rounded-lg px-3 text-sm font-medium text-navy transition-colors hover:bg-canvas">
              {switchLink.label}
            </Link>
          )}
          <Link href="/" className="flex min-h-[36px] items-center rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink">
            Back to GlobalPath website
          </Link>
        </div>
        <form action={signOutAction} className="-mx-3 mt-1">
          <button type="submit" className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-[#9A2E14] transition-colors hover:bg-[#FFF1EC]">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="portal-shell min-h-screen bg-canvas lg:grid lg:grid-cols-[280px_1fr]">
      <a href="#portal-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="portal-sidebar"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-11 w-11 place-items-center rounded-full border border-line text-navy"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <aside
        id="portal-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] border-r border-line bg-white transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0 shadow-lift" : "-translate-x-full"
        )}
      >
        {sidebar}
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div id="portal-content" className="min-w-0 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
