import Link from "next/link";
import { Search } from "lucide-react";
import { Alert, Card, EmptyState, PageHeader, TableWrap, buttonClass, inputClass, tdClass, thClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";

export const metadata = { title: "Students" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; notice?: string }> }) {
  const { supabase } = await requireStaff("/admin/students");
  const { q = "", notice } = await searchParams;
  const term = q.trim().slice(0, 80).replace(/[%_,().*]/g, " ");

  const { data: staff } = await supabase.from("staff_roles").select("user_id");
  let query = supabase
    .from("profiles")
    .select("id, applicant_ref, first_name, last_name, email, nationality, preferred_destination, created_at, deletion_requested_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,applicant_ref.ilike.%${term}%`);
  const { data } = await query;
  const staffIds = new Set((staff ?? []).map((s) => s.user_id));
  const students = (data ?? []).filter((s) => !staffIds.has(s.id));

  return (
    <div className="grid gap-6">
      {notice === "deleted" && <Alert tone="success">The account and its stored documents were deleted.</Alert>}
      <PageHeader title="Students" />
      <Card>
        <form className="flex flex-col gap-3 sm:flex-row" role="search">
          <label htmlFor="q" className="sr-only">Search students</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input id="q" name="q" defaultValue={q} placeholder="Name, email or applicant ID" className={`${inputClass} pl-9`} />
          </div>
          <button type="submit" className={buttonClass.navy}>Search</button>
        </form>
      </Card>
      <Card>
        {students.length === 0 ? (
          <EmptyState title="No students found" />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Applicant ID</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Destination</th>
                  <th className={thClass}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/students/${s.id}`} className="font-semibold text-navy underline underline-offset-2">{s.applicant_ref}</Link>
                      {s.deletion_requested_at && <span className="block text-xs font-semibold text-[#9A2E14]">Deletion requested</span>}
                    </td>
                    <td className={tdClass}>{s.first_name} {s.last_name}</td>
                    <td className={`${tdClass} break-all`}>{s.email}</td>
                    <td className={tdClass}>{s.preferred_destination ?? "—"}</td>
                    <td className={tdClass}>{formatDate(s.created_at)}</td>
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
