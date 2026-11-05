/**
 * ============================================================
 *  CENTRAL SITE CONFIGURATION
 *  Change the company name, contacts and links HERE ONLY.
 *  Every page and component reads from this file.
 *  Business identity and contact details must be verified before launch.
 * ============================================================
 */

const shortName = "GlobalPath";

export const siteConfig = {
  // ---- Brand ------------------------------------------------
  name: "GlobalPath Education",
  shortName,
  logoSubline: "Study Abroad Consultancy",
  tagline: "Your path to studying abroad, from application to arrival.",
  description:
    "Professional study abroad support for students and families across Africa: university applications and admission, visa preparation, documentation, flight booking and accommodation.",

  // ---- Domain (used for SEO, sitemap, OpenGraph) -------------
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpath-client-review.netlify.app",
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",

  // ---- Contact ------------------------------------------------
  // Supplied contact details; verify they are current before production launch.
  phoneDisplay: "+7 996 450 8056",
  phoneHref: "+79964508056",
  // WhatsApp number: country code + number, digits only, no "+" or spaces.
  whatsappNumber: "79964508056",

  // Supplied contact address; verify spelling and access before launch.
  email: "samaaghadike@yahoo.com",

  // Only display a complete, owner-verified office address.
  address: {
    confirmed: false,
    street: "",
    city: "",
    country: "",
    mapUrl: "",
  },

  officeHours: [] as { days: string; hours: string }[],
  timeZoneNote: "",

  // ---- Social media -------------------------------------------
  // Paste the full profile URL between the quotes, e.g.
  //   facebook: "https://www.facebook.com/globalpatheducation",
  // Each icon appears in the footer as soon as its URL is filled in;
  // empty values stay hidden so the site never shows dead links.
  social: {
    facebook: "", // https://www.facebook.com/...
    x: "", // https://x.com/...
    instagram: "", // https://www.instagram.com/...
    tiktok: "", // optional: https://www.tiktok.com/@...
  },

  // ---- WhatsApp default message ---------------------------------
  whatsappDefaultMessage: `Hello ${shortName}, I would like information about studying abroad.`,

  // ---- Booking integration --------------------------------------
  // Paste a Calendly (or similar) scheduling URL to show an embedded calendar
  // on /book-consultation. Leave empty to use the built-in request form only.
  bookingEmbedUrl: "", // e.g. "https://calendly.com/your-account/consultation"

};

export type SiteConfig = typeof siteConfig;

/** Application fee charged (via Paystack) before an eligibility review is submitted. */
export const applicationFee = { amount: 40, currency: "USD", label: "$40" };

/** Standard compliance disclaimer – reused across the site. */
export const decisionDisclaimer =
  "Visa and admission decisions are made solely by the relevant embassies, immigration authorities, universities and institutions. Our role is to provide professional guidance and application support.";

export const fundsIntegrityNotice = "We do not create or facilitate fraudulent financial documents.";

export const requirementsChangeNotice =
  "Requirements can change. Contact our team for the latest checklist or verify requirements with the relevant official authority.";
