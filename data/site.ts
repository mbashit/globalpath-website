/**
 * ============================================================
 *  CENTRAL SITE CONFIGURATION
 *  Change the company name, contacts and links HERE ONLY.
 *  Every page and component reads from this file.
 *  Items marked  // REPLACE  or  // CONFIRM  must be checked
 *  with the business owner before launch.
 * ============================================================
 */

const shortName = "GlobalPath"; // REPLACE – used in the logo and WhatsApp messages

export const siteConfig = {
  // ---- Brand ------------------------------------------------
  name: "GlobalPath Education & Mobility", // REPLACE with the registered business name
  shortName,
  logoSubline: "Education & Mobility", // REPLACE – second line of the text logo
  tagline: "Your path to study, travel and opportunity abroad.",
  description:
    "Professional support for international education, documentation, visa preparation and relocation for students and families across Africa.",

  // ---- Domain (used for SEO, sitemap, OpenGraph) -------------
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.your-domain.com", // REPLACE

  // ---- Contact ------------------------------------------------
  // Taken from the current flyer. CONFIRM the number is active on WhatsApp.
  phoneDisplay: "+7 996 450 8056",
  phoneHref: "+79964508056",
  // WhatsApp number: country code + number, digits only, no "+" or spaces.
  whatsappNumber: "79964508056",

  // Read from the flyer as "SAMAAGHADIKE@YAHOO.COM".
  // CONFIRM spelling with the owner. Strongly recommended: switch to a
  // domain email (e.g. info@your-domain.com) – it looks far more trustworthy.
  email: "samaaghadike@yahoo.com",

  // Address from the flyer: "Чайковского 5" (city and country not shown).
  // The address is ONLY displayed on the site when `confirmed` is true.
  address: {
    confirmed: false, // CONFIRM – set to true once the full address is verified
    street: "Чайковского 5", // CONFIRM – add building/office number
    city: "", // REPLACE – city of the office
    country: "", // REPLACE
    mapUrl: "", // OPTIONAL – Google Maps link to the office
  },

  officeHours: [
    // REPLACE with real hours
    { days: "Monday – Friday", hours: "09:00 – 18:00" },
    { days: "Saturday", hours: "10:00 – 15:00" },
    { days: "Sunday", hours: "WhatsApp messages only" },
  ],
  timeZoneNote: "", // REPLACE – e.g. "Times shown in West Africa Time (WAT)". Hidden when empty.

  // ---- Social media -------------------------------------------
  // Leave a value empty ("") to hide that icon. REPLACE with real profile URLs.
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },

  // ---- WhatsApp default message ---------------------------------
  whatsappDefaultMessage: `Hello ${shortName}, I would like information about studying abroad.`,

  // ---- Booking integration --------------------------------------
  // Paste a Calendly (or similar) scheduling URL to show an embedded calendar
  // on /book-consultation. Leave empty to use the built-in request form only.
  bookingEmbedUrl: "", // e.g. "https://calendly.com/your-account/consultation"

  // ---- Legal ----------------------------------------------------
  legalEntity: "[REGISTERED COMPANY NAME]", // REPLACE
  lastLegalUpdate: "[DATE]", // REPLACE with the date the legal pages were approved
};

export type SiteConfig = typeof siteConfig;

/** Standard compliance disclaimer – reused across the site. */
export const decisionDisclaimer =
  "Visa and admission decisions are made solely by the relevant embassies, immigration authorities, universities and institutions. Our role is to provide professional guidance and application support.";

export const fundsIntegrityNotice = "We do not create or facilitate fraudulent financial documents.";

export const requirementsChangeNotice =
  "Requirements can change. Contact our team for the latest checklist or verify requirements with the relevant official authority.";
