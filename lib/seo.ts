import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

type SeoInput = { title: string; description: string; path: string; keywords?: string[] };

/** Unique title, description, canonical and OpenGraph tags for each page. */
export function buildMetadata({ title, description, path, keywords = [] }: SeoInput): Metadata {
  const url = path === "/" ? "/" : path;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${siteConfig.shortName}`,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_NG",
      images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.shortName}`,
      description,
      images: ["/images/og-image.png"],
    },
  };
}

export const baseKeywords = [
  "study abroad agency Nigeria",
  "study abroad consultant Africa",
  "international education consultant",
  "student visa documentation",
  "university admission assistance",
];
