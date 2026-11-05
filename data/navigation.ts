export type NavChild = { label: string; href: string; note?: string };
/** `menuOnly` items appear in the mobile menu but not the desktop bar (the logo links home; FAQs are in the footer). */
export type NavItem = { label: string; href: string; children?: NavChild[]; menuOnly?: boolean };

export const mainNav: NavItem[] = [
  { label: "Home", href: "/", menuOnly: true },
  { label: "Study Abroad", href: "/study-abroad" },
  { label: "Destinations", href: "/destinations" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "All services", href: "/services", note: "Admissions, visas, documents, flights" },
      { label: "Visa support", href: "/visa-support", note: "Checklists, review and interview prep" },
      { label: "Proof of funds guidance", href: "/proof-of-funds", note: "Financial documentation explained" },
      { label: "Document services", href: "/document-services", note: "Translation and notarization" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "FAQs", href: "/faqs", menuOnly: true },
  { label: "Contact", href: "/contact" },
];

export const footerLinks = {
  quick: [
    { label: "Study Abroad", href: "/study-abroad" },
    { label: "Destinations", href: "/destinations" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "FAQs", href: "/faqs" },
    { label: "Contact", href: "/contact" },
  ],
  services: [
    { label: "Admissions", href: "/study-abroad" },
    { label: "Visa Support", href: "/visa-support" },
    { label: "Proof of Funds Guidance", href: "/proof-of-funds" },
    { label: "Translation", href: "/document-services" },
    { label: "Flights & Accommodation", href: "/services#travel" },
  ],
  portal: [
    { label: "Student Portal", href: "/portal" },
    { label: "Log in", href: "/login" },
    { label: "Create Account", href: "/signup" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};
