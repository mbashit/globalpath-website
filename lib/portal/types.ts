import type { ApplicationStatus, ConsultationStatus, DegreeLevel, DocumentStatus, QualificationLevel } from "./constants";

/** Row shapes for the tables in supabase/migrations/*_student_portal.sql */

export type Profile = {
  id: string;
  applicant_ref: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  phone: string | null;
  preferred_destination: string | null;
  deletion_requested_at: string | null;
  created_at: string;
};

export type AcademicQualification = {
  id: string;
  level: QualificationLevel;
  institution: string;
  country: string;
  qualification_name: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  graduation_status: string;
  grade: string | null;
  grading_system: string | null;
};

export type LanguageQualification = {
  id: string;
  test: string;
  test_name_other: string | null;
  language: string;
  result: string;
  sub_scores: string | null;
  test_date: string | null;
  certificate_document_id: string | null;
};

export type DocumentVersion = {
  id: string;
  document_id: string;
  version_no: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  scan_status: string;
  upload_completed: boolean;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  owner_id: string;
  category: string;
  title: string;
  application_id: string | null;
  status: DocumentStatus;
  current_version_id: string | null;
  latest_feedback: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentCategory = {
  code: string;
  label: string;
  description: string | null;
  reusable: boolean;
  sensitive: boolean;
};

export type University = {
  id: string;
  name: string;
  country: string;
  city: string | null;
  website_url: string | null;
  source_url: string;
  verified_on: string;
  notes: string | null;
  published: boolean;
};

export type Course = {
  id: string;
  university_id: string;
  name: string;
  degree_level: DegreeLevel;
  field_of_study: string | null;
  language_of_instruction: string | null;
  duration: string | null;
  intake: string | null;
  application_route: string | null;
  requirements_summary: string | null;
  source_url: string;
  verified_on: string;
  published: boolean;
};

export type Application = {
  id: string;
  student_id: string;
  reference: string;
  course_id: string | null;
  programme_snapshot: string;
  degree_level: DegreeLevel | null;
  intake: string | null;
  student_notes: string | null;
  status: ApplicationStatus;
  staff_feedback: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type ConsultationRequest = {
  id: string;
  user_id: string;
  service: string;
  destination: string | null;
  preferred_date: string | null;
  message: string | null;
  status: ConsultationStatus;
  confirmed_for: string | null;
  staff_note: string | null;
  created_at: string;
};

/** Result shape returned by every portal server action. */
export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> } | null;
