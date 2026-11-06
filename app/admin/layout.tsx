import type { Metadata } from "next";
import { connection } from "next/server";
import { Shell, type ShellNavItem } from "@/components/portal/Shell";
import { NotConfigured } from "@/components/portal/NotConfigured";
import { getProfile, requireStaff } from "@/lib/portal/auth";
import { isPortalConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: { default: "Staff Area", template: "%s | GlobalPath Staff" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  if (!isPortalConfigured) return <NotConfigured />;
  const { supabase, role, developer } = await requireStaff("/admin");
  const [profile, { count: queue }, { count: pendingStories }] = await Promise.all([
    getProfile(),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review").eq("review_unlocked", true),
    role === "admin"
      ? supabase.from("site_testimonials").select("id", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);

  const nav: ShellNavItem[] = [
    { label: "Dashboard", href: "/admin", icon: "dashboard" },
    { label: "Students", href: "/admin/students", icon: "students" },
    { label: "Applications", href: "/admin/applications", icon: "applications" },
    { label: "Document queue", href: "/admin/documents", icon: "verification", badge: queue ?? 0 },
    { label: "Reviews", href: "/admin/reviews", icon: "reviews" },
    { label: "Consultations", href: "/admin/consultations", icon: "consultations" },
  ];
  if (role === "admin") {
    nav.push(
      { label: "Website photos", href: "/admin/photos", icon: "photos" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "testimonials", badge: pendingStories ?? 0 },
      { label: "Universities & courses", href: "/admin/universities", icon: "universities" },
      { label: "Document requirements", href: "/admin/requirements", icon: "requirements" },
      { label: "Staff & assignments", href: "/admin/staff", icon: "staff" },
      { label: "Audit log", href: "/admin/audit", icon: "guide" }
    );
  }

  return (
    <Shell
      nav={nav}
      area={developer ? "Developer" : role === "admin" ? "Administrator" : "Reviewer"}
      userName={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Staff"}
      subtitle={profile?.email ?? ""}
      switchLink={{ label: "Student view", href: "/portal" }}
    >
      {children}
    </Shell>
  );
}
