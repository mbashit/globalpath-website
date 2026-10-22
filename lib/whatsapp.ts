import { siteConfig } from "@/data/site";
import { destinations } from "@/data/destinations";

/** Build a wa.me link with a prefilled message. */
export function whatsappLink(message: string = siteConfig.whatsappDefaultMessage) {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Page-aware WhatsApp message, e.g. a country-specific message on destination pages. */
export function whatsappMessageForPath(pathname: string | null): string {
  const n = siteConfig.shortName;
  if (!pathname) return siteConfig.whatsappDefaultMessage;
  const dest = destinations.find((d) => pathname.startsWith(`/destinations/${d.slug}`));
  if (dest) return dest.whatsappMessage;
  const map: Record<string, string> = {
    "/proof-of-funds": `Hello ${n}, I would like guidance on the financial documents needed for my application.`,
    "/visa-support": `Hello ${n}, I would like help preparing my student visa documents.`,
    "/document-services": `Hello ${n}, I would like a quote for translating and notarizing my documents.`,
    "/book-consultation": `Hello ${n}, I would like to request a consultation.`,
    "/destinations": `Hello ${n}, I would like help choosing a study destination.`,
  };
  return map[pathname] ?? siteConfig.whatsappDefaultMessage;
}
