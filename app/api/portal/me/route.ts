import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalConfigured } from "@/lib/supabase/config";

/**
 * Contact details of the signed-in student, used to prefill the existing
 * consultation form. Returns 401 for visitors, so public forms are unchanged.
 */
export async function GET() {
  const noStore = { "Cache-Control": "private, no-store" };
  if (!isPortalConfigured) return NextResponse.json({ signedIn: false }, { status: 401, headers: noStore });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email_confirmed_at) return NextResponse.json({ signedIn: false }, { status: 401, headers: noStore });
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, preferred_destination")
    .eq("id", auth.user.id)
    .maybeSingle();
  return NextResponse.json(
    {
      signedIn: true,
      name: [data?.first_name, data?.last_name].filter(Boolean).join(" "),
      email: data?.email ?? auth.user.email ?? "",
      whatsapp: data?.phone ?? "",
      destination: data?.preferred_destination ?? "",
    },
    { headers: noStore }
  );
}
