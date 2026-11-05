/**
 * Supabase connection settings for the student portal.
 * The public website works without these; the portal shows a
 * "not configured" notice until both values are set.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isPortalConfigured = Boolean(supabaseUrl && supabasePublishableKey);

/** Private bucket created by supabase/migrations/*_student_portal.sql */
export const DOCUMENT_BUCKET = "student-documents";
