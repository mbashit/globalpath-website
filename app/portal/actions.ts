"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_BUCKET } from "@/lib/supabase/config";
import { requireUser } from "@/lib/portal/auth";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, editableApplicationStatuses, graduationStatuses, languageTests, qualificationLevels } from "@/lib/portal/constants";
import { initializeFeePayment, isPaystackConfigured } from "@/lib/paystack";
import { siteConfig } from "@/data/site";
import { fileProblem, scanFile, type ScanResult } from "@/lib/portal/file-security";
import { friendlyDbError, isUuid, isoDate, optional, passwordIssues, str } from "@/lib/portal/validation";
import { rateLimited } from "@/lib/portal/rate-limit";
import type { ActionState } from "@/lib/portal/types";

/*
 * Student-side server actions. Every query runs as the signed-in user, so
 * Row Level Security and the column grants in the migration decide what is
 * allowed; the checks here only produce friendlier messages.
 */

const saved = (message = "Saved."): ActionState => ({ ok: true, message });

// ---------------------------------------------------------------- profile
export async function updateProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser("/portal/profile");
  const firstName = str(form, "first_name", 100);
  const lastName = str(form, "last_name", 100);
  if (!firstName || !lastName) return { error: "Enter your legal first and last names." };
  const dob = isoDate(form, "date_of_birth");
  if (dob && (dob < "1900-01-01" || dob > new Date().toISOString().slice(0, 10))) return { error: "Enter a valid date of birth." };
  const phone = optional(form, "phone", 30);
  if (phone && !/^\+?[0-9\s().-]{7,20}$/.test(phone)) return { error: "Enter a phone number with country code, like +234 800 000 0000." };

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      nationality: optional(form, "nationality", 100),
      country_of_residence: optional(form, "country_of_residence", 100),
      phone,
      preferred_destination: optional(form, "preferred_destination", 100),
    })
    .eq("id", user.id);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/portal", "layout");
  return saved("Your profile was saved.");
}

// ------------------------------------------------- academic qualifications
export async function saveQualificationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/education");
  const id = str(form, "id", 36);
  const level = str(form, "level", 30);
  const graduation = str(form, "graduation_status", 30);
  const row = {
    level,
    institution: str(form, "institution", 200),
    country: str(form, "country", 100),
    qualification_name: str(form, "qualification_name", 200),
    field_of_study: optional(form, "field_of_study", 200),
    start_date: isoDate(form, "start_date"),
    end_date: isoDate(form, "end_date"),
    graduation_status: graduation,
    grade: optional(form, "grade", 50),
    grading_system: optional(form, "grading_system", 100),
  };
  if (!(level in qualificationLevels)) return { error: "Choose the qualification level." };
  if (!row.institution || !row.country || !row.qualification_name) return { error: "Enter the institution, country and qualification name." };
  if (!(graduation in graduationStatuses)) return { error: "Choose the graduation status." };
  if (row.start_date && row.end_date && row.end_date < row.start_date) return { error: "The end date must be after the start date." };

  const { error } = id && isUuid(id) ? await supabase.from("academic_qualifications").update(row).eq("id", id) : await supabase.from("academic_qualifications").insert(row);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/portal", "layout");
  return saved("Qualification saved.");
}

export async function deleteQualificationAction(form: FormData) {
  const { supabase } = await requireUser("/portal/education");
  const id = str(form, "id", 36);
  if (isUuid(id)) await supabase.from("academic_qualifications").delete().eq("id", id);
  revalidatePath("/portal", "layout");
}

// --------------------------------------------------- language qualifications
export async function saveLanguageAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/education");
  const id = str(form, "id", 36);
  const test = str(form, "test", 20);
  const cert = str(form, "certificate_document_id", 36);
  const row = {
    test,
    test_name_other: test === "Other" ? optional(form, "test_name_other", 100) : null,
    language: str(form, "language", 60) || "English",
    result: str(form, "result", 60),
    sub_scores: optional(form, "sub_scores", 200),
    test_date: isoDate(form, "test_date"),
    certificate_document_id: isUuid(cert) ? cert : null,
  };
  if (!(languageTests as readonly string[]).includes(test)) return { error: "Choose the test or certificate." };
  if (test === "Other" && !row.test_name_other) return { error: "Enter the name of the test or certificate." };
  if (!row.result) return { error: "Enter your overall score or level." };

  const { error } = id && isUuid(id) ? await supabase.from("language_qualifications").update(row).eq("id", id) : await supabase.from("language_qualifications").insert(row);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/portal", "layout");
  return saved("Language qualification saved.");
}

export async function deleteLanguageAction(form: FormData) {
  const { supabase } = await requireUser("/portal/education");
  const id = str(form, "id", 36);
  if (isUuid(id)) await supabase.from("language_qualifications").delete().eq("id", id);
  revalidatePath("/portal", "layout");
}

// --------------------------------------------------------------- shortlist
export async function toggleShortlistAction(form: FormData) {
  const { supabase } = await requireUser("/portal/universities");
  const courseId = str(form, "course_id", 36);
  const universityId = str(form, "university_id", 36);
  const column = isUuid(courseId) ? "course_id" : isUuid(universityId) ? "university_id" : null;
  if (!column) return;
  const value = column === "course_id" ? courseId : universityId;
  if (form.get("saved") === "1") {
    await supabase.from("shortlist_items").delete().eq(column, value);
  } else {
    await supabase.from("shortlist_items").insert(column === "course_id" ? { course_id: value } : { university_id: value });
  }
  revalidatePath("/portal/universities");
}

// ------------------------------------------------------------ applications
export async function createApplicationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/applications/new");
  const courseId = str(form, "course_id", 36);
  if (!isUuid(courseId)) return { error: "Choose a programme from the verified listings." };
  const { data, error } = await supabase
    .from("applications")
    .insert({ course_id: courseId, intake: optional(form, "intake", 100), student_notes: optional(form, "student_notes", 4000) })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyDbError(error, "Could not create the application.") };
  revalidatePath("/portal", "layout");
  redirect(`/portal/applications/${data.id}?notice=created`);
}

export async function updateApplicationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/applications");
  const id = str(form, "id", 36);
  if (!isUuid(id)) return { error: "Application not found." };
  const { data, error } = await supabase
    .from("applications")
    .update({ intake: optional(form, "intake", 100), student_notes: optional(form, "student_notes", 4000) })
    .eq("id", id)
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (!data?.length) return { error: "This application can no longer be edited." };
  revalidatePath(`/portal/applications/${id}`);
  return saved("Application details saved.");
}

export async function setAttachmentAction(form: FormData) {
  const { supabase } = await requireUser("/portal/applications");
  const applicationId = str(form, "application_id", 36);
  const documentId = str(form, "document_id", 36);
  if (!isUuid(applicationId) || !isUuid(documentId)) return;
  if (form.get("attach") === "1") {
    await supabase.from("application_documents").insert({ application_id: applicationId, document_id: documentId });
  } else {
    await supabase.from("application_documents").delete().eq("application_id", applicationId).eq("document_id", documentId);
  }
  revalidatePath(`/portal/applications/${applicationId}`);
}

export async function applicationStatusAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser("/portal/applications");
  const id = str(form, "id", 36);
  const intent = str(form, "intent", 20);
  if (!isUuid(id)) return { error: "Application not found." };
  const { error } =
    intent === "submit"
      ? await supabase.rpc("submit_application", { p_application_id: id })
      : intent === "withdraw" || intent === "draft"
        ? await supabase.rpc("student_update_application_status", { p_application_id: id, p_status: intent === "withdraw" ? "withdrawn" : "draft" })
        : { error: { message: "Unknown action" } };
  if (error) return { error: friendlyDbError(error) };
  if (intent === "submit") {
    const { sendPortalUpdateEmail } = await import("@/lib/portal/email");
    await sendPortalUpdateEmail(user.id, "application submitted to GlobalPath");
  }
  revalidatePath("/portal", "layout");
  return saved(intent === "submit" ? "Submitted to GlobalPath for internal review." : intent === "withdraw" ? "Application withdrawn." : "Returned to draft. You can edit it again.");
}

/**
 * Starts the Paystack checkout for one application's fee. The same readiness
 * checks as submit_application run first, so students never pay for an
 * application that cannot be submitted yet. The database still enforces
 * that a recorded payment exists before submission.
 */
export async function payApplicationFeeAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser("/portal/applications");
  const id = str(form, "id", 36);
  if (!isUuid(id)) return { error: "Application not found." };
  if (!isPaystackConfigured) return { error: "Online payment is not available yet. Please contact GlobalPath on WhatsApp to pay your application fee." };
  if (await rateLimited("pay", 10, 10 * 60_000)) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const [{ data: app }, { count: attachments }, { data: paid }] = await Promise.all([
    supabase.from("applications").select("id, status, course_id").eq("id", id).eq("student_id", user.id).maybeSingle(),
    supabase.from("application_documents").select("document_id", { count: "exact", head: true }).eq("application_id", id),
    supabase.from("application_payments").select("id").eq("application_id", id).maybeSingle(),
  ]);
  if (!app || !editableApplicationStatuses.includes(app.status)) return { error: "This application cannot be paid for right now." };
  if (paid) return { error: "The fee for this application is already paid. You can submit it now." };
  if (!app.course_id) return { error: "Choose a programme before paying." };
  if (!attachments) return { error: "Attach at least one document before paying and submitting." };

  let checkoutUrl: string;
  try {
    checkoutUrl = await initializeFeePayment(user.email ?? "", `${siteConfig.url}/portal/applications/${id}/payment`, {
      kind: "application_fee",
      applicationId: id,
      studentId: user.id,
    });
  } catch (error) {
    console.error("Paystack initialisation failed", error);
    return { error: "Payment could not be started. Please try again in a few minutes." };
  }
  redirect(checkoutUrl);
}

export async function deleteApplicationAction(form: FormData) {
  const { supabase } = await requireUser("/portal/applications");
  const id = str(form, "id", 36);
  if (!isUuid(id)) return;
  // Remove files of application-specific documents first; RLS confirms ownership.
  const { data: app } = await supabase.from("applications").select("id, status").eq("id", id).maybeSingle();
  if (!app || app.status !== "draft") return;
  const { data: versions } = await supabase.from("documents").select("document_versions(storage_path)").eq("application_id", id);
  const paths = (versions ?? []).flatMap((d) => (d.document_versions as { storage_path: string }[]).map((v) => v.storage_path));
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (!error && paths.length) await createAdminClient().storage.from(DOCUMENT_BUCKET).remove(paths);
  revalidatePath("/portal", "layout");
  redirect("/portal/applications");
}

// --------------------------------------------------------------- documents
export type BeginUploadResult = { ok: true; versionId: string; signedUrl: string } | { ok: false; error: string };

/** Step 1: register the upload and get a single-use signed URL for one private path. */
export async function beginUploadAction(input: {
  documentId?: string;
  category?: string;
  title?: string;
  applicationId?: string;
  fileName: string;
  mimeType: string;
  size: number;
}): Promise<BeginUploadResult> {
  const { supabase, user } = await requireUser("/portal/documents");
  if (await rateLimited("upload", 30, 10 * 60_000)) return { ok: false, error: "Too many uploads in a short time. Please wait a few minutes." };
  await removeStaleUploads(user.id);
  if (!ALLOWED_UPLOAD_TYPES[input.mimeType]) return { ok: false, error: "Only PDF, JPG, PNG or WebP files are accepted." };
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Files must be 10 MB or smaller." };
  const fileName = String(input.fileName ?? "").replace(/[^\p{L}\p{N}._ ()-]/gu, "_").slice(0, 200) || "document";

  const { data, error } = await supabase.rpc("begin_document_upload", {
    p_document_id: isUuid(input.documentId) ? input.documentId : null,
    p_category: String(input.category ?? "").slice(0, 50),
    p_title: String(input.title ?? "").slice(0, 150),
    p_application_id: isUuid(input.applicationId) ? input.applicationId : null,
    p_file_name: fileName,
    p_mime_type: input.mimeType,
    p_size_bytes: Math.floor(input.size),
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return { ok: false, error: friendlyDbError(error, "Could not start the upload.") };

  const { data: signed, error: signError } = await createAdminClient().storage.from(DOCUMENT_BUCKET).createSignedUploadUrl(row.storage_path);
  if (signError || !signed) return { ok: false, error: "Secure storage is unavailable. Please try again later." };
  return { ok: true, versionId: row.version_id, signedUrl: signed.signedUrl };
}

/** Uploads started over an hour ago and never completed: remove the file and the placeholder rows. */
async function removeStaleUploads(userId: string) {
  try {
    const admin = createAdminClient();
    const { data: stale } = await admin
      .from("document_versions")
      .select("id, document_id, storage_path")
      .eq("uploaded_by", userId)
      .eq("upload_completed", false)
      .eq("scan_status", "pending")
      .lt("created_at", new Date(Date.now() - 60 * 60_000).toISOString())
      .limit(50);
    if (!stale?.length) return;
    await admin.storage.from(DOCUMENT_BUCKET).remove(stale.map((v) => v.storage_path));
    await admin.from("document_versions").delete().in("id", stale.map((v) => v.id));
    await admin.from("documents").delete().in("id", stale.map((v) => v.document_id)).is("current_version_id", null);
  } catch {
    // Best effort; the next upload tries again.
  }
}

/** Step 2: verify the stored bytes server-side, then make the version current. */
export async function finalizeUploadAction(versionId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireUser("/portal/documents");
  if (!isUuid(versionId)) return { ok: false, error: "Upload not found." };
  // RLS: only the owner can see their version row.
  const { data: version } = await supabase
    .from("document_versions")
    .select("id, document_id, storage_path, mime_type, size_bytes, file_name, upload_completed, documents(current_version_id)")
    .eq("id", versionId)
    .maybeSingle();
  if (!version || version.upload_completed) return { ok: false, error: "Upload not found." };

  const admin = createAdminClient();
  const bucket = admin.storage.from(DOCUMENT_BUCKET);
  const { data: blob, error: dlError } = await bucket.download(version.storage_path);
  if (dlError || !blob) return { ok: false, error: "The file did not reach secure storage. Please try again." };
  const bytes = new Uint8Array(await blob.arrayBuffer());

  let reason = fileProblem(bytes, version.mime_type, version.size_bytes, MAX_UPLOAD_BYTES);
  let scan: ScanResult = "failed";
  if (!reason) {
    scan = await scanFile(bytes, version.file_name);
    if (scan === "infected") reason = "This file was blocked by the malware scan.";
    if (scan === "failed") reason = "The security check is temporarily unavailable. Please try again later.";
  }

  // Store the exact bytes that were checked, with the verified content type,
  // at a path no upload link covers. The browser-uploaded original is removed.
  let storedPath = version.storage_path;
  if (!reason) {
    const checkedPath = version.storage_path.replace(/(\.[a-z]+)$/, ".checked$1");
    const { error: storeError } = await bucket.upload(checkedPath, Buffer.from(bytes), { contentType: version.mime_type, upsert: false });
    const { error: pathError } = storeError
      ? { error: storeError }
      : await admin.from("document_versions").update({ storage_path: checkedPath }).eq("id", version.id);
    if (storeError || pathError) {
      if (!storeError) await bucket.remove([checkedPath]);
      reason = "Secure storage is unavailable. Please try again later.";
      scan = "failed";
    } else {
      storedPath = checkedPath;
    }
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const { error: finError } = await admin.rpc("finalize_document_version", {
    p_version_id: version.id,
    p_sha256: sha256,
    p_scan: reason ? (scan === "infected" ? "infected" : "failed") : scan,
  });
  await bucket.remove([version.storage_path]);
  if (reason || finError) {
    if (storedPath !== version.storage_path) await bucket.remove([storedPath]);
    const doc = version.documents as unknown as { current_version_id: string | null } | null;
    if (!doc?.current_version_id) await admin.from("documents").delete().eq("id", version.document_id);
    revalidatePath("/portal", "layout");
    return { ok: false, error: reason ?? "Could not complete the upload." };
  }

  const { data: owner } = await supabase.auth.getUser();
  if (owner.user) {
    const { sendPortalUpdateEmail } = await import("@/lib/portal/email");
    await sendPortalUpdateEmail(owner.user.id, "document received");
  }
  revalidatePath("/portal", "layout");
  return { ok: true };
}

export async function deleteDocumentAction(form: FormData) {
  const { supabase } = await requireUser("/portal/documents");
  const id = str(form, "id", 36);
  if (!isUuid(id)) return;
  const { data: doc } = await supabase
    .from("documents")
    .select("id, status, document_versions(storage_path), application_documents(applications(status))")
    .eq("id", id)
    .maybeSingle();
  if (!doc || doc.status === "under_review") return;
  const links = (doc.application_documents ?? []) as unknown as { applications: { status: string } | null }[];
  if (links.some((l) => l.applications && !["draft", "withdrawn", "closed"].includes(l.applications.status))) return;
  const paths = (doc.document_versions as { storage_path: string }[]).map((v) => v.storage_path);
  const admin = createAdminClient();
  if (paths.length) await admin.storage.from(DOCUMENT_BUCKET).remove(paths);
  await admin.from("documents").delete().eq("id", doc.id);
  await admin.from("audit_logs").insert({ actor_id: (await supabase.auth.getUser()).data.user?.id, action: "document.deleted", entity: "document", entity_id: doc.id });
  revalidatePath("/portal", "layout");
}

// ------------------------------------------------- notifications & messages
export async function markAllReadAction() {
  const { supabase, user } = await requireUser("/portal/notifications");
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/portal", "layout");
}

export async function sendMessageAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser("/portal/notifications");
  if (await rateLimited("message", 10, 10 * 60_000)) return { error: "Please wait a few minutes before sending another message." };
  const body = str(form, "body", 4000);
  if (!body) return { error: "Write a message first." };
  const { error } = await supabase.from("messages").insert({ student_id: user.id, body });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/portal/notifications");
  return saved("Message sent to GlobalPath.");
}

// ---------------------------------------------------------------- settings
export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser("/portal/settings");
  if (await rateLimited("password", 5, 10 * 60_000)) return { error: "Too many attempts. Please wait a few minutes." };
  const current = String(form.get("currentPassword") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirmPassword") ?? "");
  const issues = passwordIssues(password, user.email ?? "");
  if (issues.length) return { error: `New password needs ${issues.join(", ")}.` };
  if (password !== confirm) return { error: "New passwords do not match." };
  // Re-check the current password before changing it.
  const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: current });
  if (authError) return { error: "Your current password is incorrect." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Choose a password you have not used for this account." };
    if (error.code === "insufficient_aal") return { error: "Sign out and sign in again with your authenticator code, then retry." };
    return { error: "Could not change your password. Please try again." };
  }
  return saved("Password changed.");
}

export async function changeEmailAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/settings");
  if (await rateLimited("email-change", 3, 10 * 60_000)) return { error: "Please wait a few minutes and try again." };
  const email = str(form, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Enter a valid email address." };
  const { siteConfig } = await import("@/data/site");
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${siteConfig.url}/auth/confirm?next=/portal/settings` });
  if (error) return { error: "Could not start the email change. Please try again." };
  return saved("Check both your current and new inbox for confirmation links. The change takes effect once confirmed.");
}

export async function requestDeletionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/settings");
  if (str(form, "confirm", 20) !== "DELETE") return { error: "Type DELETE to confirm." };
  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/portal/settings");
  return saved("Deletion requested. GlobalPath will confirm by email once your account and documents are deleted.");
}

// ------------------------------------------------------------ share a story
export async function submitStoryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser("/portal/share-story");
  if (await rateLimited("story", 5, 60 * 60_000)) return { error: "Too many submissions. Please try again later." };
  const quote = str(form, "quote", 800);
  const name = str(form, "name", 80);
  if (quote.length < 20) return { error: "Tell us a little more: at least 20 characters." };
  if (name.length < 2) return { error: "Enter the name to show, for example \"Chinedu O.\"." };
  if (form.get("consent") !== "on") return { error: "Tick the box to let GlobalPath publish your review." };
  const { error } = await supabase.rpc("submit_testimonial", {
    p_quote: quote,
    p_name: name,
    p_context: str(form, "context", 120),
    p_destination: str(form, "destination", 60),
  });
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/portal/share-story");
  revalidatePath("/portal");
  return saved("Thank you. GlobalPath will read your review before it appears on the website.");
}