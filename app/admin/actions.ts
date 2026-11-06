"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_BUCKET } from "@/lib/supabase/config";
import { requireStaff } from "@/lib/portal/auth";
import { sendPortalUpdateEmail } from "@/lib/portal/email";
import { consultationStatuses, degreeLevels, staffApplicationStatuses, staffDocumentDecisions } from "@/lib/portal/constants";
import { friendlyDbError, isUuid, isoDate, optional, str } from "@/lib/portal/validation";
import type { ActionState } from "@/lib/portal/types";

/*
 * Staff server actions. All run as the signed-in staff member; the
 * database functions and RLS policies enforce role, assignment and MFA.
 * The service-role client is used only for storage cleanup, emails and
 * the administrator's account deletion, each after a database-side check.
 */

const done = (message: string): ActionState => ({ ok: true, message });
const httpsUrl = (v: string | null) => (v && /^https:\/\/[^\s]+$/.test(v) ? v : null);

// -------------------------------------------------------- document review
export async function reviewDocumentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "document_id", 36);
  const { supabase } = await requireStaff(`/admin/documents/${id}`);
  const status = str(form, "status", 30);
  if (!isUuid(id) || !(staffDocumentDecisions as string[]).includes(status)) return { error: "Choose a decision." };
  const { error } = await supabase.rpc("staff_review_document", { p_document_id: id, p_status: status, p_feedback: str(form, "feedback", 2000) });
  if (error) return { error: friendlyDbError(error) };
  if (status !== "under_review") {
    const { data: doc } = await supabase.from("documents").select("owner_id").eq("id", id).single();
    if (doc) await sendPortalUpdateEmail(doc.owner_id, "document review update");
  }
  revalidatePath("/admin", "layout");
  return done("Review saved. The student can see the new status.");
}

// ----------------------------------------------------- application status
export async function setApplicationStatusAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const id = str(form, "application_id", 36);
  const { supabase } = await requireStaff(`/admin/applications/${id}`);
  const status = str(form, "status", 30);
  if (!isUuid(id) || !(staffApplicationStatuses as string[]).includes(status)) return { error: "Choose a status." };
  const { error } = await supabase.rpc("staff_set_application_status", { p_application_id: id, p_status: status, p_note: str(form, "note", 4000) });
  if (error) return { error: friendlyDbError(error) };
  const { data: app } = await supabase.from("applications").select("student_id").eq("id", id).single();
  if (app) await sendPortalUpdateEmail(app.student_id, "application status update");
  revalidatePath("/admin", "layout");
  return done("Status updated and the student was notified.");
}

// ---------------------------------------------------------------- messages
export async function sendStaffMessageAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const studentId = str(form, "student_id", 36);
  const { supabase } = await requireStaff(`/admin/students/${studentId}`);
  const body = str(form, "body", 4000);
  if (!isUuid(studentId) || !body) return { error: "Write a message first." };
  const { error } = await supabase.from("messages").insert({ student_id: studentId, body });
  if (error) return { error: friendlyDbError(error, "Could not send the message. Are you assigned to this student?") };
  await sendPortalUpdateEmail(studentId, "new message from GlobalPath");
  revalidatePath(`/admin/students/${studentId}`);
  return done("Message sent.");
}

// ----------------------------------------------------------- consultations
export async function updateConsultationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff("/admin/consultations");
  const id = str(form, "id", 36);
  const status = str(form, "status", 20);
  const when = str(form, "confirmed_for", 30);
  if (!isUuid(id) || !(status in consultationStatuses)) return { error: "Choose a status." };
  const confirmedFor = when ? new Date(`${when}:00Z`) : null;
  if (confirmedFor && Number.isNaN(confirmedFor.getTime())) return { error: "Enter a valid date and time." };
  const { error } = await supabase.rpc("staff_update_consultation", {
    p_id: id,
    p_status: status,
    p_confirmed_for: confirmedFor?.toISOString() ?? null,
    p_note: str(form, "staff_note", 1000),
  });
  if (error) return { error: friendlyDbError(error) };
  if (status === "confirmed") {
    const { data } = await supabase.from("consultation_requests").select("user_id").eq("id", id).single();
    if (data) await sendPortalUpdateEmail(data.user_id, "consultation confirmed");
  }
  revalidatePath("/admin", "layout");
  return done("Consultation updated.");
}

// ------------------------------------------------- universities & courses
export async function saveUniversityAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff("/admin/universities", "admin");
  const id = str(form, "id", 36);
  const row = {
    name: str(form, "name", 200),
    country: str(form, "country", 100),
    city: optional(form, "city", 100),
    website_url: httpsUrl(optional(form, "website_url", 500)),
    source_url: httpsUrl(str(form, "source_url", 500)),
    verified_on: isoDate(form, "verified_on"),
    notes: optional(form, "notes", 2000),
    published: form.get("published") === "on",
  };
  if (!row.name || !row.country) return { error: "Enter the university name and country." };
  if (!row.source_url) return { error: "Enter the official https:// source page you checked." };
  if (!row.verified_on) return { error: "Enter the date you checked the official source." };
  const { error } = isUuid(id) ? await supabase.from("universities").update(row).eq("id", id) : await supabase.from("universities").insert(row);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/admin/universities");
  return done("University saved.");
}

export async function deleteUniversityAction(form: FormData) {
  const { supabase } = await requireStaff("/admin/universities", "admin");
  const id = str(form, "id", 36);
  if (isUuid(id)) await supabase.from("universities").delete().eq("id", id);
  revalidatePath("/admin/universities");
}

export async function saveCourseAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff("/admin/universities", "admin");
  const id = str(form, "id", 36);
  const level = str(form, "degree_level", 30);
  const row = {
    university_id: str(form, "university_id", 36),
    name: str(form, "name", 200),
    degree_level: level,
    field_of_study: optional(form, "field_of_study", 200),
    language_of_instruction: optional(form, "language_of_instruction", 100),
    duration: optional(form, "duration", 100),
    intake: optional(form, "intake", 200),
    application_route: optional(form, "application_route", 200),
    requirements_summary: optional(form, "requirements_summary", 4000),
    source_url: httpsUrl(str(form, "source_url", 500)),
    verified_on: isoDate(form, "verified_on"),
    published: form.get("published") === "on",
  };
  if (!isUuid(row.university_id) || !row.name || !(level in degreeLevels)) return { error: "Enter the course name and degree level." };
  if (!row.source_url) return { error: "Enter the official https:// programme page you checked." };
  if (!row.verified_on) return { error: "Enter the date you checked the official source." };
  const { error } = isUuid(id) ? await supabase.from("courses").update(row).eq("id", id) : await supabase.from("courses").insert(row);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/admin/universities");
  return done("Course saved.");
}

export async function deleteCourseAction(form: FormData) {
  const { supabase } = await requireStaff("/admin/universities", "admin");
  const id = str(form, "id", 36);
  if (isUuid(id)) await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/admin/universities");
}

// --------------------------------------------------- document requirements
export async function addRequirementAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff("/admin/requirements", "admin");
  const level = str(form, "degree_level", 30);
  const category = str(form, "category", 50);
  if (!(level in degreeLevels) || !category) return { error: "Choose a degree level and document category." };
  const { error } = await supabase.from("document_requirements").upsert(
    { degree_level: level, category, required: form.get("required") === "on", notes: optional(form, "notes", 500) },
    { onConflict: "degree_level,category" }
  );
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/admin/requirements");
  return done("Requirement saved.");
}

export async function deleteRequirementAction(form: FormData) {
  const { supabase } = await requireStaff("/admin/requirements", "admin");
  const id = str(form, "id", 36);
  if (isUuid(id)) await supabase.from("document_requirements").delete().eq("id", id);
  revalidatePath("/admin/requirements");
}

// ------------------------------------------------------ staff & assignments
export async function setStaffRoleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff("/admin/staff", "admin");
  const email = str(form, "email", 254);
  const role = str(form, "role", 20);
  if (!email) return { error: "Enter the person's account email." };
  // The database decides who may grant which role (administrators: reviewers only).
  const { error } = await supabase.rpc("admin_set_staff_role", { p_email: email, p_role: ["reviewer", "admin", "developer"].includes(role) ? role : null });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/admin/staff");
  return done(role ? "Role saved. The person must set up two-step verification before staff tools unlock." : "Staff access removed.");
}

export async function assignReviewerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const studentId = str(form, "student_id", 36);
  const { supabase } = await requireStaff(`/admin/students/${studentId}`, "admin");
  const reviewerId = str(form, "reviewer_id", 36);
  if (!isUuid(reviewerId) || !isUuid(studentId)) return { error: "Choose a reviewer." };
  const { error } = await supabase.rpc("admin_assign_reviewer", { p_reviewer: reviewerId, p_student: studentId, p_active: form.get("active") !== "0" });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/admin", "layout");
  return done("Assignment updated.");
}

// --------------------------------------------------------- account deletion
export async function deleteStudentAccountAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const studentId = str(form, "student_id", 36);
  const { supabase, user } = await requireStaff(`/admin/students/${studentId}`, "admin");
  if (!isUuid(studentId) || studentId === user.id) return { error: "Invalid account." };
  const { data: profile } = await supabase.from("profiles").select("applicant_ref").eq("id", studentId).maybeSingle();
  if (!profile) return { error: "Student not found." };
  if (str(form, "confirm", 30) !== profile.applicant_ref) return { error: `Type ${profile.applicant_ref} to confirm.` };
  const { data: isStaff } = await supabase.from("staff_roles").select("user_id").eq("user_id", studentId).maybeSingle();
  if (isStaff) return { error: "Remove this person's staff role first." };

  const admin = createAdminClient();
  const { data: docs } = await admin.from("documents").select("document_versions(storage_path)").eq("owner_id", studentId);
  const recorded = (docs ?? []).flatMap((d) => (d.document_versions as { storage_path: string }[]).map((v) => v.storage_path));
  // Also sweep the student's folder ({student}/{document}/{file}) for files no row points to.
  const bucket = admin.storage.from(DOCUMENT_BUCKET);
  const { data: folders, error: listError } = await bucket.list(studentId, { limit: 1000 });
  if (listError) return { error: "Could not list stored files. Nothing was deleted; try again." };
  const swept: string[] = [];
  for (const folder of folders ?? []) {
    const { data: files } = await bucket.list(`${studentId}/${folder.name}`, { limit: 1000 });
    swept.push(...(files ?? []).filter((f) => f.id).map((f) => `${studentId}/${folder.name}/${f.name}`));
  }
  const paths = [...new Set([...recorded, ...swept])];
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await admin.storage.from(DOCUMENT_BUCKET).remove(paths.slice(i, i + 100));
    if (error) return { error: "Could not delete stored files. Nothing else was deleted; try again." };
  }
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "account.deleted",
    entity: "profile",
    entity_id: studentId,
    metadata: { applicant_ref: profile.applicant_ref, files_removed: paths.length },
  });
  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) return { error: "Files were removed but the account could not be deleted. Try again." };
  redirect("/admin/students?notice=deleted");
}
