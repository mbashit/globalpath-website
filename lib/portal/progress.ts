import type { Profile } from "./types";

export type CompletionInput = {
  profile: Profile;
  academicCount: number;
  languageCount: number;
  documentCount: number;
};

/** Profile completion, computed only from stored data. */
export function profileCompletion({ profile, academicCount, languageCount, documentCount }: CompletionInput) {
  const checks: { label: string; done: boolean; href: string }[] = [
    { label: "Legal first and last name", done: Boolean(profile.first_name && profile.last_name), href: "/portal/profile" },
    { label: "Date of birth", done: Boolean(profile.date_of_birth), href: "/portal/profile" },
    { label: "Nationality", done: Boolean(profile.nationality), href: "/portal/profile" },
    { label: "Country of residence", done: Boolean(profile.country_of_residence), href: "/portal/profile" },
    { label: "Phone / WhatsApp number", done: Boolean(profile.phone), href: "/portal/profile" },
    { label: "Preferred study destination", done: Boolean(profile.preferred_destination), href: "/portal/profile" },
    { label: "At least one academic qualification", done: academicCount > 0, href: "/portal/education" },
    { label: "Language qualification", done: languageCount > 0, href: "/portal/education#language" },
    { label: "At least one uploaded document", done: documentCount > 0, href: "/portal/documents" },
  ];
  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), checks };
}
