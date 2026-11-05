import Link from "next/link";
import { Card, EmptyState, PageHeader, StatusBadge, TableWrap, buttonClass, inputClass, tdClass, thClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { documentStatuses, formatDate, type DocumentStatus } from "@/lib/portal/constants";

export const metadata = { title: "Document queue" };

export default async function DocumentQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireStaff("/admin/documents");
  const { status } = await searchParams;
  const filter = status === "all" ? null : status && status in documentStatuses ? [status as DocumentStatus] : (["pending_review", "under_review"] as DocumentStatus[]);

  let query = supabase
    .from("documents")
    .select("id, title, category, status, updated_at, profiles!documents_owner_id_fkey(first_name, last_name, applicant_ref)")
    .not("current_version_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(200);
  if (filter) query = query.in("status", filter);
  const [{ data }, { data: cats }] = await Promise.all([query, supabase.from("document_categories").select("code, label")]);
  type Row = { id: string; title: string; category: string; status: DocumentStatus; updated_at: string; profiles: { first_name: string; last_name: string; applicant_ref: string } | null };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Document queue" intro="Oldest first. Open a document to review it." />
      <Card>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="status" className="text-sm font-semibold text-ink">Show</label>
          <select id="status" name="status" defaultValue={status ?? ""} className={`${inputClass} mt-0 sm:w-72`}>
            <option value="">Awaiting review</option>
            <option value="all">All documents</option>
            {Object.entries(documentStatuses).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button type="submit" className={buttonClass.navy}>Filter</button>
        </form>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Nothing in this queue" />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Document</th>
                  <th className={thClass}>Student</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/documents/${d.id}`} className="font-semibold text-navy underline underline-offset-2">{d.title}</Link>
                      <span className="block text-xs text-ink-faint">{(cats ?? []).find((c) => c.code === d.category)?.label ?? d.category}</span>
                    </td>
                    <td className={tdClass}>
                      {d.profiles?.first_name} {d.profiles?.last_name}
                      <span className="block text-xs text-ink-faint">{d.profiles?.applicant_ref}</span>
                    </td>
                    <td className={tdClass}><StatusBadge status={d.status} map={documentStatuses} /></td>
                    <td className={tdClass}>{formatDate(d.updated_at, true)}</td>
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
