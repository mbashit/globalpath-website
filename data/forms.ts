/**
 * FORM DEFINITIONS
 * Each form on the site is built from one of these field lists,
 * so fields can be added/removed here without touching the UI.
 */
import { destinations } from "./destinations";
import { consultationTypes } from "./services";

export type FieldType = "text" | "email" | "tel" | "select" | "textarea" | "date" | "time" | "number";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  autoComplete?: string;
  half?: boolean; // two columns on larger screens
  hint?: string;
  min?: number;
};

const opt = (values: string[]) => values.map((v) => ({ value: v, label: v }));

export const destinationOptions = [
  ...destinations.map((d) => ({ value: d.name, label: d.name })),
  { value: "Not sure yet", label: "Not sure yet" },
  { value: "Other", label: "Other" },
];

const firstLast: Field[] = [
  { name: "firstName", label: "First name", type: "text", required: true, autoComplete: "given-name", half: true },
  { name: "lastName", label: "Last name", type: "text", required: true, autoComplete: "family-name", half: true },
];
const fullName: Field = { name: "name", label: "Full name", type: "text", required: true, autoComplete: "name" };
const email: Field = { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", half: true };
const whatsapp: Field = {
  name: "whatsapp",
  label: "WhatsApp number",
  type: "tel",
  required: true,
  autoComplete: "tel",
  placeholder: "+234 800 000 0000",
  hint: "Include your country code",
  half: true,
};
const currentCountry: Field = { name: "currentCountry", label: "Current country", type: "text", required: true, autoComplete: "country-name", half: true };
const destination: Field = { name: "destination", label: "Preferred destination", type: "select", required: true, options: destinationOptions, half: true };
const message: Field = { name: "message", label: "Message", type: "textarea", placeholder: "Tell us briefly about your plans" };

export const eligibilityFields: Field[] = [
  ...firstLast,
  email,
  whatsapp,
  currentCountry,
  destination,
  { name: "course", label: "Preferred course", type: "text", required: true, placeholder: "e.g. Computer Science", half: true },
  {
    name: "qualification",
    label: "Highest qualification",
    type: "select",
    required: true,
    half: true,
    options: opt(["WAEC / NECO / SSCE", "A-Levels / IJMB / JUPEB", "OND / HND", "Bachelor's degree", "Master's degree", "Other"]),
  },
  { name: "graduationYear", label: "Graduation year", type: "number", required: true, min: 1970, half: true, placeholder: "e.g. 2024" },
  {
    name: "budget",
    label: "Estimated study budget (per year)",
    type: "select",
    half: true,
    options: opt(["Not sure yet", "Low tuition / public universities", "Mid-range", "Flexible", "Seeking scholarships"]),
    hint: "Helps us suggest realistic options",
  },
  {
    name: "intake",
    label: "Preferred intake",
    type: "select",
    half: true,
    options: opt(["As soon as possible", "Next spring / January intake", "Next autumn / September intake", "Not sure yet"]),
  },
  message,
];

export const contactFields: Field[] = [
  fullName,
  email,
  whatsapp,
  { ...currentCountry, label: "Country", half: true },
  { name: "service", label: "Service needed", type: "select", required: true, options: consultationTypes, half: true },
  { ...destination, required: false },
  { ...message, required: true },
];

export const consultationFields: Field[] = [
  fullName,
  email,
  whatsapp,
  currentCountry,
  { ...destination, label: "Destination" },
  { name: "service", label: "Consultation type", type: "select", required: true, options: consultationTypes, half: true },
  { name: "preferredDate", label: "Preferred date", type: "date", required: true, half: true },
  {
    name: "preferredTime",
    label: "Preferred time",
    type: "select",
    required: true,
    half: true,
    options: opt(["Morning (09:00 – 12:00)", "Afternoon (12:00 – 15:00)", "Late afternoon (15:00 – 18:00)"]),
    hint: "We will confirm the exact time with you",
  },
  message,
];

export const financialReviewFields: Field[] = [
  fullName,
  email,
  whatsapp,
  { ...destination, label: "Destination" },
  {
    name: "sponsorType",
    label: "Who is funding your studies?",
    type: "select",
    half: true,
    options: opt(["Myself", "Parent(s)", "Other relative", "Scholarship", "Combination", "Not sure yet"]),
  },
  { ...message, placeholder: "What would you like us to review? Please do not include account numbers." },
];

export const documentFields: Field[] = [
  {
    name: "documentType",
    label: "Document type",
    type: "select",
    required: true,
    half: true,
    options: opt(["Diploma / degree certificate", "Academic transcript", "Police clearance", "Birth certificate", "Marriage certificate", "WAEC / NECO result", "Other"]),
  },
  { name: "pages", label: "Number of pages", type: "number", required: true, min: 1, half: true },
  { name: "sourceLanguage", label: "Source language", type: "text", required: true, placeholder: "e.g. English", half: true },
  { name: "targetLanguage", label: "Required language", type: "text", required: true, placeholder: "e.g. German, Russian", half: true },
  {
    name: "purpose",
    label: "Purpose",
    type: "select",
    required: true,
    half: true,
    options: opt(["University admission", "Visa application", "Recognition of qualifications", "Employment", "Other"]),
  },
  { name: "deadline", label: "Deadline", type: "date", half: true },
  fullName,
  email,
  whatsapp,
];
