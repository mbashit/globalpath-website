/**
 * Services shown on the homepage and the Services page.
 * `icon` must be a key of the icon map in components/Icon.tsx.
 */
import type { IconName } from "@/components/Icon";

export type ServiceSummary = {
  title: string;
  icon: IconName;
  summary: string;
  href: string;
};

export const homeServices: ServiceSummary[] = [
  {
    title: "University Admission Support",
    icon: "graduation",
    summary:
      "From choosing suitable institutions to preparing and submitting your application, we guide you through each stage of the admission process.",
    href: "/study-abroad",
  },
  {
    title: "Visa Application Support",
    icon: "stamp",
    summary:
      "Clear document checklists, application review and interview preparation based on the official requirements of your destination.",
    href: "/visa-support",
  },
  {
    title: "Proof of Funds Guidance",
    icon: "wallet",
    summary:
      "Understand what financial evidence your destination asks for and how to present genuine, well-organised supporting documents.",
    href: "/proof-of-funds",
  },
  {
    title: "Sponsorship Documentation",
    icon: "handshake",
    summary:
      "Guidance for parents, relatives and sponsors on the letters, records and evidence that usually accompany a sponsored application.",
    href: "/proof-of-funds#sponsorship",
  },
  {
    title: "Document Translation",
    icon: "languages",
    summary:
      "Translation of diplomas, transcripts, certificates and police clearance documents, coordinated with qualified translators.",
    href: "/document-services",
  },
  {
    title: "Notarization Assistance",
    icon: "filecheck",
    summary:
      "We coordinate notarization and explain certification steps such as apostille or legalisation where your destination requires them.",
    href: "/document-services#notarization",
  },
  {
    title: "Invitation Letter Guidance",
    icon: "mail",
    summary:
      "For destinations such as Russia, we explain how official study invitations are issued by universities and what you must provide.",
    href: "/destinations/russia",
  },
  {
    title: "Relocation Support",
    icon: "luggage",
    summary:
      "Pre-departure checklists, accommodation guidance and arrival information so your first weeks abroad feel manageable.",
    href: "/services#relocation",
  },
];

export type ServiceCategory = {
  id: string;
  title: string;
  icon: IconName;
  intro: string;
  items: string[];
  note?: string;
  cta: { label: string; href: string };
};

export const serviceCategories: ServiceCategory[] = [
  {
    id: "study-abroad",
    title: "Study abroad",
    icon: "graduation",
    intro: "Find a programme that fits your qualifications, budget and goals, then apply with a complete, well-prepared file.",
    items: [
      "University selection",
      "Programme research",
      "Admission eligibility review",
      "Application support",
      "Statement and document checklist",
      "Offer-letter guidance",
      "Enrolment support",
    ],
    cta: { label: "Check your eligibility", href: "/study-abroad#eligibility" },
  },
  {
    id: "visa",
    title: "Visa application support",
    icon: "stamp",
    intro: "We help you understand what the embassy asks for and organise your documents so your application is complete and consistent.",
    items: [
      "Document checklist",
      "Application review",
      "Embassy requirement guidance",
      "Appointment preparation",
      "Interview preparation",
      "Supporting-document organisation",
    ],
    cta: { label: "Explore visa support", href: "/visa-support" },
  },
  {
    id: "financial",
    title: "Financial documentation",
    icon: "wallet",
    intro: "Guidance on presenting genuine financial evidence. We explain the requirements; the funds and documents must be real and your own or your sponsor's.",
    items: [
      "Proof of funds requirement guidance",
      "Sponsorship documentation",
      "Financial-document checklist",
      "Source-of-funds preparation",
      "Blocked-account guidance",
      "Tuition and payment guidance",
    ],
    note: "We do not create or facilitate fraudulent financial documents.",
    cta: { label: "Read the financial guide", href: "/proof-of-funds" },
  },
  {
    id: "documents",
    title: "Translation & documentation",
    icon: "languages",
    intro:
      "Translation and document support for diplomas, certificates, academic transcripts, police clearance, birth and marriage certificates and other supporting documents.",
    items: ["Translation", "Notarization coordination", "Document certification guidance"],
    note: "Translations are completed by qualified translators we work with. Ask us which certification your destination accepts.",
    cta: { label: "Get document support", href: "/document-services" },
  },
  {
    id: "relocation",
    title: "Relocation",
    icon: "luggage",
    intro: "Preparation for the move itself, so you arrive knowing what to do in your first days and weeks.",
    items: [
      "Pre-departure checklist",
      "Accommodation guidance",
      "Travel preparation",
      "Arrival information",
      "University registration guidance",
      "Local settlement information",
    ],
    cta: { label: "Talk to an adviser", href: "/book-consultation?service=relocation" },
  },
];

export const consultationTypes = [
  { value: "study-abroad", label: "Study Abroad Consultation" },
  { value: "visa", label: "Visa Documentation Review" },
  { value: "financial", label: "Financial Documentation Consultation" },
  { value: "documents", label: "Translation / Documentation" },
  { value: "relocation", label: "Relocation Consultation" },
];
