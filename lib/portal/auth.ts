import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPortalConfigured } from "@/lib/supabase/config";
import type { Profile } from "./types";

export type StaffRole = "reviewer" | "admin";

/** The signed-in user (verified with Supabase Auth), deduplicated per request. */
export const getSession = cache(async () => {
  // Private pages are always rendered per request, never prerendered or cached.
  await connection();
  if (!isPortalConfigured) return { supabase: null, user: null } as const;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null } as const;
});

export async function requireUser(next: string) {
  const { supabase, user } = await getSession();
  if (!supabase || !user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const { supabase, user } = await getSession();
  if (!supabase || !user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

/**
 * Staff context. `assignedRole` is what the account was granted;
 * `activeRole` is what the database will honour right now (null until the
 * session is MFA-verified when MFA is required).
 */
export const getStaffContext = cache(async () => {
  const { supabase, user } = await getSession();
  if (!supabase || !user) return { assignedRole: null, activeRole: null, mfaRequired: true } as const;
  const [{ data: own }, { data: active }, { data: config }] = await Promise.all([
    supabase.from("staff_roles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("current_staff_role"),
    supabase.from("portal_config").select("require_staff_mfa").eq("id", 1).maybeSingle(),
  ]);
  return {
    assignedRole: (own?.role as StaffRole | undefined) ?? null,
    activeRole: (active as StaffRole | null) ?? null,
    mfaRequired: config?.require_staff_mfa ?? true,
  } as const;
});

export async function requireStaff(next: string, minimum: StaffRole = "reviewer") {
  const session = await requireUser(next);
  const staff = await getStaffContext();
  if (!staff.assignedRole) redirect("/portal");
  if (!staff.activeRole) redirect(`/login/mfa?next=${encodeURIComponent(next)}`);
  if (minimum === "admin" && staff.activeRole !== "admin") redirect("/admin");
  return { ...session, role: staff.activeRole };
}
