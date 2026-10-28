import type { Metadata } from "next";
import { connection } from "next/server";
import { Shell, type ShellNavItem } from "@/components/portal/Shell";
import { NotConfigured } from "@/components/portal/NotConfigured";
import { getProfile, getStaffContext, requireUser } from "@/lib/portal/auth";
import { isPortalConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: { default: "Student Portal", template: "%s | GlobalPath Student Portal" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await connection();
  if (!isPortalConfigured) return <NotConfigured />;
  const { supabase, user } = await requireUser("/portal");
  const [profile, staff, { count: unread }] = await Promise.all([
    getProfile(),
    getStaffContext(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const nav: ShellNavItem[] = [
    { label: "Dashboard", href: "/portal", icon: "dashboard" },
    { label: "My Profile", href: "/portal/profile", icon: "profile" },
    { label: "Educational History", href: "/portal/education", icon: "education" },
    { label: "Universities & Courses", href: "/portal/universities", icon: "universities" },
    { label: "My Applications", href: "/portal/applications", icon: "applications" },
    { label: "My Documents", href: "/portal/documents", icon: "documents" },
    { label: "Document Verification", href: "/portal/verification", icon: "verification" },
    { label: "Messages & Notifications", href: "/portal/notifications", icon: "notifications", badge: unread ?? 0 },
    { label: "Consultations", href: "/portal/consultations", icon: "consultations" },
    { label: "Account Settings", href: "/portal/settings", icon: "settings" },
  ];

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Student";
  return (
    <Shell
      nav={nav}
      area="Student portal"
      userName={name}
      subtitle={profile?.applicant_ref ?? ""}
      switchLink={staff.assignedRole ? { label: "Staff area", href: "/admin" } : undefined}
    >
      {children}
    </Shell>
  );
}
