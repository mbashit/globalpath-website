"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { mainNav } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import { whatsappLink, whatsappMessageForPath } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "./SocialIcons";
import { AccountLinks, MobileAccountLinks } from "./AccountLinks";
import { cn } from "@/lib/cn";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  // Close menus on navigation
  useEffect(() => {
    startTransition(() => {
      setOpen(false);
      setServicesOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll + Escape to close on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setServicesOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setServicesOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const waHref = whatsappLink(whatsappMessageForPath(pathname));
  const servicePaths = ["/services", "/visa-support", "/proof-of-funds", "/document-services"];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-shadow",
        scrolled ? "border-line shadow-[0_6px_20px_-14px_rgba(23,27,94,.35)]" : "border-transparent"
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <nav className="container flex h-[72px] items-center justify-between gap-4" aria-label="Main">
        <Logo />

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 xl:flex">
          {mainNav.map((item) =>
            item.children ? (
              <li key={item.href} className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-expanded={servicesOpen}
                  aria-controls="services-menu"
                  onClick={() => setServicesOpen((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.93rem] font-medium transition-colors hover:bg-navy-soft hover:text-navy",
                    servicePaths.some((p) => pathname?.startsWith(p)) ? "text-navy" : "text-ink-muted"
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", servicesOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <div
                  id="services-menu"
                  className={cn(
                    "absolute left-1/2 top-full mt-2 w-[320px] -translate-x-1/2 rounded-2xl border border-line bg-white p-2 shadow-lift transition-all",
                    servicesOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                  )}
                >
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} className="block rounded-xl px-4 py-3 hover:bg-canvas">
                      <span className="block font-semibold text-ink">{c.label}</span>
                      {c.note && <span className="block text-sm text-ink-muted">{c.note}</span>}
                    </Link>
                  ))}
                </div>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[0.93rem] font-medium transition-colors hover:bg-navy-soft hover:text-navy",
                    isActive(item.href) ? "text-navy" : "text-ink-muted"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          )}
        </ul>

        <div className="flex items-center gap-2">
          <AccountLinks className="hidden xl:block" />
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#1FAF55] text-white transition-colors hover:bg-[#178a43]"
          >
            <WhatsAppGlyph />
          </a>
          <Link
            href="/book-consultation"
            className="hidden min-h-[44px] items-center rounded-full bg-brandorange px-5 text-[0.93rem] font-semibold text-navy-ink transition-colors hover:bg-gold sm:inline-flex"
          >
            Request a Consultation
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-navy xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div
        id="mobile-menu"
        className={cn(
          "absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-72px)] overflow-y-auto bg-white transition-[opacity,transform] duration-300 xl:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        )}
      >
        <ul className="container flex flex-col py-4">
          {mainNav.map((item) => (
            <li key={item.href} className="border-b border-line last:border-0">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn("flex min-h-[56px] items-center font-display text-xl font-semibold", isActive(item.href) ? "text-navy" : "text-ink")}
              >
                {item.label}
              </Link>
              {item.children && (
                <ul className="mb-3 grid gap-1 pl-3">
                  {item.children.slice(1).map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className="flex min-h-[44px] items-center text-ink-muted hover:text-navy">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="container grid gap-3 pb-10">
          <Link href="/book-consultation" className="flex min-h-[52px] items-center justify-center rounded-full bg-brandorange font-semibold text-navy-ink">
              Request a Consultation
          </Link>
          <a href={`tel:${siteConfig.phoneHref}`} className="flex min-h-[52px] items-center justify-center rounded-full border-2 border-navy/15 font-semibold text-navy">
            Call {siteConfig.phoneDisplay}
          </a>
          <MobileAccountLinks />
        </div>
      </div>
    </header>
  );
}
