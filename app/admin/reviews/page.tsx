import Link from "next/link";
import { Card, EmptyState, PageHeader, StatusBadge, TableWrap, tdClass, thClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { documentStatuses, formatDate, type DocumentStatus } from "@/lib/portal/constants";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ mine?: string }> }) {
  const { supabase, user, role } = await requireStaff("/admin/reviews");
  const { mine } = await searchParams;
  let query = supabase
    .from("document_reviews")
    .select("id, to_status, from_status, feedback, created_at, reviewer_id, documents(id, title, profiles!documents_owner_id_fkey(first_name, last_name, applicant_ref))")
    .not("reviewer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (mine === "1") query = query.eq("reviewer_id", user.id);
  const [{ data }, { data: assignments }] = await Promise.all([
    query,
    supabase.from("reviewer_assignments").select("student_id, profiles!reviewer_assignments_student_id_fkey(first_name, last_name, applicant_ref)").eq("reviewer_id", user.id).eq("active", true),
  ]);
  type Row = { id: string; to_status: DocumentStatus; from_status: DocumentStatus | null; feedback: string | null; created_at: string; reviewer_id: string; documents: { id: string; title: string; profiles: { first_name: string; last_name: string; applicant_ref: string } | null } | null };
  const rows = (data ?? []) as unknown as Row[];
  type Assignment = { student_id: string; profiles: { first_name: string; last_name: string; applicant_ref: string } | null };

  return (
    <div className="grid gap-6">
      <PageHeader title="Reviews" intro="Every document decision with its reviewer and time." />
      {role === "reviewer" && (
        <Card title="My assigned students">
          {(assignments ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">No students are assigned to you yet. Ask an administrator.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {((assignments ?? []) as unknown as Assignment[]).map((a) => (
                <li key={a.student_id}>
                  <Link href={`/admin/students/${a.student_id}`} className="inline-block rounded-full bg-navy-soft px-3 py-1.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white">
                    {a.profiles?.first_name} {a.profiles?.last_name} · {a.profiles?.applicant_ref}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      <Card actions={<Link href={mine === "1" ? "/admin/reviews" : "/admin/reviews?mine=1"} className="text-sm font-semibold text-navy hover:underline">{mine === "1" ? "Show all" : "Only my reviews"}</Link>}>
        {rows.length === 0 ? (
          <EmptyState title="No reviews yet" />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Document</th>
                  <th className={thClass}>Decision</th>
                  <th className={thClass}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={tdClass}>
                      {formatDate(r.created_at, true)}
                      {r.reviewer_id === user.id && <span className="block text-xs text-ink-faint">by you</span>}
                    </td>
                    <td className={tdClass}>
                      <Link href={`/admin/documents/${r.documents?.id}`} className="font-semibold text-navy hover:underline">{r.documents?.title}</Link>
                      <span className="block text-xs text-ink-faint">{r.documents?.profiles?.first_name} {r.documents?.profiles?.last_name} · {r.documents?.profiles?.applicant_ref}</span>
                    </td>
                    <td className={tdClass}><StatusBadge status={r.to_status} map={documentStatuses} /></td>
                    <td className={`${tdClass} max-w-xs text-ink-muted`}>{r.feedback ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
