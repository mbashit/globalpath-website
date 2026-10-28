import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/data/site";

/**
 * Transactional "you have an update" emails for portal events.
 * Deliberately generic: no document contents, file names, grades or
 * feedback are included – the student signs in to read details.
 *
 * Sends through Resend when RESEND_API_KEY and PORTAL_EMAIL_FROM are set;
 * otherwise only the in-app notification is created. Account emails
 * (verification, password reset) are sent by Supabase Auth itself.
 */
export async function sendPortalUpdateEmail(userId: string, subject: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PORTAL_EMAIL_FROM;
  if (!apiKey || !from) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("email, first_name").eq("id", userId).maybeSingle();
    if (!data?.email) return;
    const portalUrl = `${siteConfig.url}/portal/notifications`;
    const greeting = data.first_name ? `Hello ${data.first_name},` : "Hello,";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [data.email],
        subject: `${siteConfig.shortName}: ${subject}`,
        text: `${greeting}\n\nThere is an update in your ${siteConfig.shortName} student portal: ${subject}.\n\nSign in to view the details:\n${portalUrl}\n\nFor your privacy, we do not include document or application details in email.\n\n${siteConfig.name}`,
      }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    console.error("Portal update email could not be sent");
  }
}
