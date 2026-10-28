import Link from "next/link";
import { Card, EmptyState, PageHeader, StatusBadge, TableWrap, buttonClass, inputClass, tdClass, thClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { applicationStatuses, formatDate, type ApplicationStatus } from "@/lib/portal/constants";

export const metadata = { title: "Applications" };

export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireStaff("/admin/applications");
  const { status } = await searchParams;
  const filter = status && status in applicationStatuses ? (status as ApplicationStatus) : "";

  let query = supabase
    .from("applications")
    .select("id, reference, programme_snapshot, status, submitted_at, updated_at, profiles!applications_student_id_fkey(first_name, last_name, applicant_ref)")
    .neq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (filter) query = query.eq("status", filter);
  const { data } = await query;
  type Row = { id: string; reference: string; programme_snapshot: string; status: ApplicationStatus; submitted_at: string | null; updated_at: string; profiles: { first_name: string; last_name: string; applicant_ref: string } | null };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Applications" intro="Drafts are private to the student and are not shown until submitted." />
      <Card>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="status" className="text-sm font-semibold text-ink">Status</label>
          <select id="status" name="status" defaultValue={filter} className={`${inputClass} mt-0 sm:w-72`}>
            <option value="">All submitted</option>
            {Object.entries(applicationStatuses)
              .filter(([k]) => k !== "draft")
              .map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
          </select>
          <button type="submit" className={buttonClass.navy}>Filter</button>
        </form>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No applications" />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Reference</th>
                  <th className={thClass}>Student</th>
                  <th className={thClass}>Programme</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/applications/${a.id}`} className="font-semibold text-navy underline underline-offset-2">{a.reference}</Link>
                    </td>
                    <td className={tdClass}>
                      {a.profiles?.first_name} {a.profiles?.last_name}
                      <span className="block text-xs text-ink-faint">{a.profiles?.applicant_ref}</span>
                    </td>
                    <td className={tdClass}>{a.programme_snapshot}</td>
                    <td className={tdClass}><StatusBadge status={a.status} map={applicationStatuses} /></td>
                    <td className={tdClass}>{formatDate(a.submitted_at)}</td>
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
