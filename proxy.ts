import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPortalConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase session cookie and keeps signed-out visitors out
 * of /portal and /admin. Only runs on portal/auth routes (see matcher),
 * so the public website is untouched. Pages and the database still check
 * permissions themselves; this is the first gate, not the only one.
 */
export async function proxy(request: NextRequest) {
  if (!isPortalConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;
  const isPrivate = pathname.startsWith("/portal") || pathname.startsWith("/admin");

  if (isPrivate && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    const hadSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    if (hadSession) url.searchParams.set("reason", "expired");
    return NextResponse.redirect(url);
  }

  if (signedIn && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/login", "/signup", "/reset-password"],
};
