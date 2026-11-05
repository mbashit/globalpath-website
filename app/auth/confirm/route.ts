import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isPortalConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/portal/validation";

/**
 * Target of the links in Supabase Auth emails (sign-up verification,
 * password reset, email change). Supports the recommended token_hash
 * email templates and the PKCE ?code= flow.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));
  if (!isPortalConfigured) return fail("unavailable");

  const supabase = await createClient();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return fail("link");
    const dest = type === "recovery" ? "/reset-password" : type === "signup" || type === "email" ? `${next}${next.includes("?") ? "&" : "?"}notice=verified` : next;
    return NextResponse.redirect(new URL(dest, url.origin));
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("link");
    return NextResponse.redirect(new URL(next, url.origin));
  }
  return fail("link");
}
