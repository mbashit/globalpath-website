"use client";

import { usePathname } from "next/navigation";

/** Hides the public header/footer/WhatsApp chrome inside /portal and /admin, which have their own layout. */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/portal") || pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
