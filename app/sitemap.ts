import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { destinations } from "@/data/destinations";
import { publishedTestimonials } from "@/data/testimonials";

const staticPaths = [
  "", "/study-abroad", "/destinations", "/services", "/proof-of-funds", "/document-services", "/visa-support",
  "/about", "/faqs", "/contact", "/book-consultation", "/privacy-policy", "/terms", "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls = [
    ...staticPaths.map((p) => ({ url: `${siteConfig.url}${p}`, lastModified: now, priority: p === "" ? 1 : 0.7 })),
    ...destinations.map((d) => ({ url: `${siteConfig.url}/destinations/${d.slug}`, lastModified: now, priority: 0.8 })),
  ];
  if (publishedTestimonials.length > 0) {
    urls.push({ url: `${siteConfig.url}/success-stories`, lastModified: now, priority: 0.7 });
  }
  return urls;
}
