import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton, MobileCTABar } from "@/components/WhatsAppButton";
import { PublicOnly } from "@/components/PublicOnly";
import { siteConfig } from "@/data/site";
import { baseKeywords } from "@/lib/seo";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["500", "600", "700", "800"] });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | Study Abroad & Visa Documentation Support`, template: `%s | ${siteConfig.shortName}` },
  description: siteConfig.description,
  keywords: baseKeywords,
  applicationName: siteConfig.name,
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
    locale: "en_NG",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: siteConfig.allowIndexing, follow: siteConfig.allowIndexing },
};

export const viewport: Viewport = {
  themeColor: "#252B83",
  width: "device-width",
  initialScale: 1,
};

// Organisation structured data. Only facts from data/site.ts – nothing invented.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  email: siteConfig.email,
  telephone: siteConfig.phoneHref,
  ...(siteConfig.address.confirmed
    ? { address: { "@type": "PostalAddress", streetAddress: siteConfig.address.street, addressLocality: siteConfig.address.city, addressCountry: siteConfig.address.country } }
    : {}),
  sameAs: Object.values(siteConfig.social).filter(Boolean),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <PublicOnly>
          <Navbar />
        </PublicOnly>
        <main id="main">{children}</main>
        <PublicOnly>
          <Footer />
          <WhatsAppButton />
          <MobileCTABar />
        </PublicOnly>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
