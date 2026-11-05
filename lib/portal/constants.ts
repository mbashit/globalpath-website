/**
 * Shared vocabulary for the student portal. Values mirror the Postgres
 * enums in supabase/migrations/*_student_portal.sql.
 */

export type Tone = "neutral" | "info" | "warn" | "success" | "danger";

export const documentStatuses = {
  uploaded: { label: "Uploaded", tone: "neutral" },
  security_check: { label: "Security check", tone: "info" },
  pending_review: { label: "Pending review", tone: "info" },
  under_review: { label: "Under review", tone: "info" },
  verified: { label: "Verified by GlobalPath", tone: "success" },
  correction_required: { label: "Correction required", tone: "warn" },
  rejected: { label: "Rejected", tone: "danger" },
} as const satisfies Record<string, { label: string; tone: Tone }>;
export type DocumentStatus = keyof typeof documentStatuses;

export const applicationStatuses = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted to GlobalPath", tone: "info" },
  under_review: { label: "Under review", tone: "info" },
  missing_documents: { label: "Missing documents", tone: "warn" },
  correction_required: { label: "Correction required", tone: "warn" },
  documents_verified: { label: "Documents verified", tone: "success" },
  review_completed: { label: "GlobalPath review completed", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
} as const satisfies Record<string, { label: string; tone: Tone }>;
export type ApplicationStatus = keyof typeof applicationStatuses;

/** Statuses in which the student may edit an application and its documents. */
export const editableApplicationStatuses: ApplicationStatus[] = ["draft", "missing_documents", "correction_required"];

/** Statuses staff may set on a submitted application. */
export const staffApplicationStatuses: ApplicationStatus[] = [
  "under_review",
  "missing_documents",
  "correction_required",
  "documents_verified",
  "review_completed",
  "closed",
];

export const staffDocumentDecisions: DocumentStatus[] = ["under_review", "verified", "correction_required", "rejected"];

export const consultationStatuses = {
  requested: { label: "Request received", tone: "info" },
  contacted: { label: "We contacted you", tone: "info" },
  confirmed: { label: "Appointment confirmed", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
} as const satisfies Record<string, { label: string; tone: Tone }>;
export type ConsultationStatus = keyof typeof consultationStatuses;

export const degreeLevels = {
  foundation: "Foundation / preparatory",
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "PhD / doctorate",
  language_course: "Language course",
  other: "Other",
} as const;
export type DegreeLevel = keyof typeof degreeLevels;

export const qualificationLevels = {
  secondary: "Secondary school",
  diploma: "Diploma (OND/HND or similar)",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: "Doctorate",
  other: "Other qualification",
} as const;
export type QualificationLevel = keyof typeof qualificationLevels;

export const graduationStatuses = {
  completed: "Completed",
  in_progress: "In progress",
  expected: "Expected to graduate",
  incomplete: "Not completed",
} as const;

export const languageTests = ["IELTS", "TOEFL", "TestDaF", "Goethe", "telc", "DSH", "Cambridge", "Duolingo", "Other"] as const;

export const scanStatuses = {
  pending: "Upload not finished",
  clean: "Malware scan passed",
  not_scanned: "File checks passed (no malware scanner configured)",
  infected: "Blocked by malware scan",
  failed: "Failed file checks",
} as const;

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" } : { timeZone: "UTC" }),
  });
}
