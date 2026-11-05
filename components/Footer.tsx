import Link from "next/link";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialIcons";
import { footerLinks } from "@/data/navigation";
import { destinations } from "@/data/destinations";
import { siteConfig, decisionDisclaimer } from "@/data/site";
import { whatsappLink } from "@/lib/whatsapp";
import { isPortalConfigured } from "@/lib/supabase/config";

function Col({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-display text-base font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-1">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="inline-flex min-h-[36px] items-center text-white/70 transition-colors hover:text-gold">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { address } = siteConfig;
  return (
    <footer className="bg-navy-ink text-white">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-5 text-white/70">{siteConfig.description}</p>
          <SocialLinks className="mt-6" />
          {isPortalConfigured && (
            <nav aria-label="Student portal" className="mt-8">
              <h2 className="font-display text-base font-semibold text-white">Student Portal</h2>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                {footerLinks.portal.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-[36px] items-center text-white/70 transition-colors hover:text-gold">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <Col title="Quick links" links={footerLinks.quick} />
          <Col title="Services" links={footerLinks.services} />
          <Col title="Destinations" links={destinations.map((d) => ({ label: d.shortName, href: `/destinations/${d.slug}` }))} />
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-display text-base font-semibold text-white">Contact</h2>
            <ul className="mt-4 space-y-3 text-white/70">
              <li>
                <span className="block text-xs text-white/50">Phone</span>
                <a href={`tel:${siteConfig.phoneHref}`} className="hover:text-gold">{siteConfig.phoneDisplay}</a>
              </li>
              <li>
                <span className="block text-xs text-white/50">WhatsApp</span>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Chat with us</a>
              </li>
              <li>
                <span className="block text-xs text-white/50">Email</span>
                <a href={`mailto:${siteConfig.email}`} className="break-all hover:text-gold">{siteConfig.email}</a>
              </li>
              <li>
                <span className="block text-xs text-white/50">Address</span>
                {address.confirmed ? (
                  <span>{[address.street, address.city, address.country].filter(Boolean).join(", ")}</span>
                ) : (
                  <span>Available on request</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container grid gap-4 py-8 text-sm text-white/55 md:grid-cols-[2fr_1fr] md:items-start">
          <p className="max-w-2xl">{decisionDisclaimer}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
            {footerLinks.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold">{l.label}</Link>
              </li>
            ))}
          </ul>
          <p className="md:col-span-2">© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
