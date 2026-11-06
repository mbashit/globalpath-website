"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseUrl } from "@/lib/supabase/config";
import { requireStaff } from "@/lib/portal/auth";
import { friendlyDbError, isUuid, str } from "@/lib/portal/validation";
import { photoSlots, SITE_CONTENT_TAG, SITE_MEDIA_BUCKET } from "@/lib/site-content";
import type { ActionState } from "@/lib/portal/types";

/*
 * Website content actions (administrators and developers).
 * Database writes run as the signed-in user, so RLS (is_admin) decides.
 * Photo files go to the public site-media bucket with the service-role
 * client, only after requireStaff(..., "admin") has passed.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/`;

/** Make the public pages pick up the change straight away. */
function refreshSite() {
  updateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
}

/** Detects JPEG/PNG/WebP from the file's first bytes; never trusts the browser's type. */
function imageType(b: Uint8Array): { ext: string; mime: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { ext: "webp", mime: "image/webp" };
  return null;
}

/** Uploads an optional photo from the form. Returns its public URL, null when no file was chosen, or an error. */
async function uploadPhoto(form: FormData, field: string, folder: string): Promise<{ url: string | null } | { error: string }> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return { url: null };
  if (file.size > MAX_BYTES) return { error: "Photos can be at most 5 MB. Export a smaller JPG and try again." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return { error: "Upload a JPG, PNG or WebP photo." };
  const path = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${type.ext}`;
  const { error } = await createAdminClient().storage.from(SITE_MEDIA_BUCKET).upload(path, bytes, { contentType: type.mime, upsert: false, cacheControl: "31536000" });
  if (error) return { error: "The photo could not be uploaded. Try again." };
  return { url: publicPrefix + path };
}

/** Deletes a previously uploaded photo (built-in /images files are never touched). */
async function removeUploaded(url: string | null | undefined) {
  if (!url?.startsWith(publicPrefix)) return;
  await createAdminClient().storage.from(SITE_MEDIA_BUCKET).remove([url.slice(publicPrefix.length)]);
}

// ------------------------------------------------------------------ photos
export async function savePhotoAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireStaff("/admin/photos", "admin");
  const slot = photoSlots.find((s) => s.key === str(form, "key", 60));
  if (!slot) return { error: "Unknown photo." };
  const alt = str(form, "alt", 200);
  if (alt.length < 3) return { error: "Describe the photo in a few words (this is read aloud to blind visitors)." };

  const { data: current } = await supabase.from("site_images").select("src").eq("key", slot.key).maybeSingle();
  const upload = await uploadPhoto(form, "photo", slot.key);
  if ("error" in upload) return { error: upload.error };
  const src = upload.url ?? current?.src ?? slot.src;

  const { error } = await supabase.from("site_images").upsert({ key: slot.key, src, alt, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) {
    await removeUploaded(upload.url);
    return { error: friendlyDbError(error) };
  }
  if (upload.url && current?.src !== upload.url) await removeUploaded(current?.src);
  refreshSite();
  return { ok: true, message: upload.url ? "Photo replaced. It is live on the website now." : "Description saved." };
}

export async function resetPhotoAction(form: FormData) {
  const { supabase } = await requireStaff("/admin/photos", "admin");
  const key = str(form, "key", 60);
  if (!photoSlots.some((s) => s.key === key)) return;
  const { data: current } = await supabase.from("site_images").select("src").eq("key", key).maybeSingle();
  const { error } = await supabase.from("site_images").delete().eq("key", key);
  if (!error) await removeUploaded(current?.src);
  refreshSite();
}

// ------------------------------------------------------------ testimonials
const statuses = ["pending", "published", "hidden"] as const;

export async function saveTestimonialAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireStaff("/admin/testimonials", "admin");
  const id = str(form, "id", 36);
  const status = str(form, "status", 20);
  const order = Number.parseInt(str(form, "sort_order", 6), 10);
  const row = {
    quote: str(form, "quote", 800),
    name: str(form, "name", 80),
    context: str(form, "context", 120),
    destination: str(form, "destination", 60),
    status: (statuses as readonly string[]).includes(status) ? status : "published",
    sort_order: Number.isFinite(order) ? Math.min(Math.max(order, 0), 9999) : 100,
  };
  if (row.quote.length < 20) return { error: "The testimonial needs at least 20 characters." };
  if (row.name.length < 2) return { error: "Enter the person's name, for example \"Chinedu O.\"." };

  const { data: current } = isUuid(id) ? await supabase.from("site_testimonials").select("image_src").eq("id", id).maybeSingle() : { data: null };
  const upload = await uploadPhoto(form, "photo", "testimonials");
  if ("error" in upload) return { error: upload.error };
  const removePhoto = form.get("remove_photo") === "on";
  const image = upload.url
    ? { image_src: upload.url, image_alt: `Portrait of ${row.name}` }
    : removePhoto
      ? { image_src: null, image_alt: null }
      : {};

  const { error } = isUuid(id)
    ? await supabase.from("site_testimonials").update({ ...row, ...image }).eq("id", id)
    : await supabase.from("site_testimonials").insert({ ...row, ...image });
  if (error) {
    await removeUploaded(upload.url);
    return { error: friendlyDbError(error) };
  }
  if ((upload.url || removePhoto) && current?.image_src) await removeUploaded(current.image_src);
  refreshSite();
  return { ok: true, message: isUuid(id) ? "Testimonial saved." : row.status === "published" ? "Testimonial added and published." : "Testimonial added." };
}

export async function setTestimonialStatusAction(form: FormData) {
  const { supabase } = await requireStaff("/admin/testimonials", "admin");
  const id = str(form, "id", 36);
  const status = str(form, "status", 20);
  if (!isUuid(id) || !(statuses as readonly string[]).includes(status)) return;
  await supabase.from("site_testimonials").update({ status }).eq("id", id);
  refreshSite();
}

export async function deleteTestimonialAction(form: FormData) {
  const { supabase } = await requireStaff("/admin/testimonials", "admin");
  const id = str(form, "id", 36);
  if (!isUuid(id)) return;
  const { data } = await supabase.from("site_testimonials").delete().eq("id", id).select("image_src").maybeSingle();
  await removeUploaded(data?.image_src);
  refreshSite();
}
