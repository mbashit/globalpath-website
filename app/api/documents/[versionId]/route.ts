import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_BUCKET, isPortalConfigured } from "@/lib/supabase/config";
import { isUuid } from "@/lib/portal/validation";

/**
 * Authorised, short-lived access to one document version.
 *
 * The version row is read as the signed-in user, so Row Level Security
 * decides access (owner, assigned reviewer or administrator). Guessing or
 * editing an id in the URL returns 404. Only then is a 60-second signed
 * URL created for the private object, and the access is audit-logged.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ versionId: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
  if (!isPortalConfigured) return NextResponse.json({ error: "Not available" }, { status: 404, headers });
  const { versionId } = await params;
  if (!isUuid(versionId)) return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required" }, { status: 401, headers });

  const { data: version } = await supabase
    .from("document_versions")
    .select("id, document_id, storage_path, file_name, upload_completed, scan_status, documents(owner_id)")
    .eq("id", versionId)
    .maybeSingle();
  if (!version || !version.upload_completed || !["clean", "not_scanned"].includes(version.scan_status)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(version.storage_path, 60, inline ? undefined : { download: version.file_name });
  if (error || !signed) return NextResponse.json({ error: "Storage unavailable" }, { status: 503, headers });

  const owner = (version.documents as unknown as { owner_id: string } | null)?.owner_id;
  // Thumbnails (inline previews) by the owner are not logged to keep the log meaningful.
  if (!(inline && owner === auth.user.id)) {
    await admin.from("audit_logs").insert({
      actor_id: auth.user.id,
      action: inline ? "document.viewed" : "document.downloaded",
      entity: "document",
      entity_id: version.document_id,
      metadata: { version_id: version.id, by_owner: owner === auth.user.id },
    });
  }
  return NextResponse.redirect(signed.signedUrl, { status: 302, headers });
}
