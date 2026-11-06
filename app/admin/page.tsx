import Link from "next/link";
import { Alert, Card, PageHeader, Stat, StatusBadge, buttonClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { documentStatuses, formatDate, type DocumentStatus } from "@/lib/portal/constants";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const { supabase, role } = await requireStaff("/admin");
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [{ data: staff }, profiles, pendingApps, docsAwaiting, appsCorrections, consultations, { data: recent }, { data: deletions }] = await Promise.all([
    supabase.from("staff_roles").select("user_id"),
    count(supabase.from("profiles").select("id", { count: "exact", head: true })),
    count(supabase.from("applications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"])),
    count(supabase.from("documents").select("id", { count: "exact", head: true }).in("status", ["pending_review", "under_review"]).eq("review_unlocked", true)),
    count(supabase.from("applications").select("id", { count: "exact", head: true }).in("status", ["missing_documents", "correction_required"])),
    count(supabase.from("consultation_requests").select("id", { count: "exact", head: true }).eq("status", "requested")),
    supabase
      .from("document_reviews")
      .select("id, to_status, created_at, reviewer_id, documents(id, title, profiles!documents_owner_id_fkey(first_name, last_name, applicant_ref))")
      .not("reviewer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
    role === "admin"
      ? supabase.from("profiles").select("id, first_name, last_name, applicant_ref, deletion_requested_at").not("deletion_requested_at", "is", null)
      : Promise.resolve({ data: [] }),
  ]);
  // Visible profiles include staff accounts; registered students excludes them.
  const students = Math.max(0, profiles - (role === "admin" ? (staff ?? []).length : 0));

  type Recent = { id: string; to_status: DocumentStatus; created_at: string; documents: { id: string; title: string; profiles: { first_name: string; last_name: string; applicant_ref: string } | null } | null };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Staff dashboard"
        intro={role === "admin" ? "You can see all students." : "You can see students assigned to you by an administrator."}
      />
      {(deletions ?? []).length > 0 && (
        <Alert tone="warn" title="Account deletion requests">
          <ul className="mt-1 list-disc pl-5">
            {(deletions ?? []).map((d) => (
              <li key={d.id}>
                <Link href={`/admin/students/${d.id}`} className="font-semibold underline">{d.first_name} {d.last_name} ({d.applicant_ref})</Link> – requested {formatDate(d.deletion_requested_at)}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={role === "admin" ? "Registered students" : "Visible accounts"} value={role === "admin" ? students : profiles} href="/admin/students" />
        <Stat label="Pending applications" value={pendingApps} hint="Submitted or under review" href="/admin/applications?status=submitted" />
        <Stat label="Documents awaiting verification" value={docsAwaiting} href="/admin/documents" />
        <Stat label="Applications needing corrections" value={appsCorrections} href="/admin/applications?status=correction_required" />
        <Stat label="New consultation requests" value={consultations} href="/admin/consultations" />
      </div>
      <Card title="Recently completed reviews" actions={<Link href="/admin/reviews" className={`${buttonClass.link} text-sm`}>All reviews</Link>}>
        {(recent ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {((recent ?? []) as unknown as Recent[]).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <Link href={`/admin/documents/${r.documents?.id}`} className="font-semibold text-navy hover:underline">{r.documents?.title}</Link>
                  <span className="text-ink-muted"> · {r.documents?.profiles?.first_name} {r.documents?.profiles?.last_name} ({r.documents?.profiles?.applicant_ref})</span>
                  <span className="block text-xs text-ink-faint">{formatDate(r.created_at, true)}</span>
                </span>
                <StatusBadge status={r.to_status} map={documentStatuses} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
