"use client";

import { usePathname } from "next/navigation";
import { whatsappLink, whatsappMessageForPath } from "@/lib/whatsapp";
import Link from "next/link";
import { WhatsAppGlyph } from "./SocialIcons";
/** Floating WhatsApp button shown on every page. Message adapts to the current page. */
export function WhatsAppButton() {
  const pathname = usePathname();
  return (
    <a
      href={whatsappLink(whatsappMessageForPath(pathname))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-[88px] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1FAF55] text-white shadow-lift transition-colors hover:bg-[#178a43] md:bottom-6 md:right-6"
    >
      <WhatsAppGlyph className="h-6 w-6" />
    </a>
  );
}

/** Sticky bottom bar on phones: the two primary actions always one tap away. */
export function MobileCTABar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="flex gap-3">
        <Link href="/book-consultation" className="flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-brandorange px-3 text-center text-[0.9rem] font-semibold leading-tight text-navy-ink">
          Request a Consultation
        </Link>
        <Link href="/study-abroad#eligibility" className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border-2 border-navy/15 px-3 text-center text-[0.9rem] font-semibold leading-tight text-navy">
          Check eligibility
        </Link>
      </div>
    </div>
  );
}
