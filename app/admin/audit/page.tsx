import { Card, EmptyState, PageHeader, TableWrap, tdClass, thClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  const { supabase } = await requireStaff("/admin/audit", "admin");
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, metadata, created_at, profiles(first_name, last_name, email)")
    .order("created_at", { ascending: false })
    .limit(300);
  type Row = { id: number; action: string; entity: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string; profiles: { first_name: string; last_name: string; email: string } | null };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Audit log" intro="Most recent 300 events: uploads, downloads, reviews, status changes and role changes. Entries cannot be edited from the portal." />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No events yet" />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Who</th>
                  <th className={thClass}>Action</th>
                  <th className={thClass}>Record</th>
                  <th className={thClass}>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={tdClass}>{formatDate(r.created_at, true)}</td>
                    <td className={`${tdClass} break-all`}>{r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}`.trim() || r.profiles.email : "System / deleted user"}</td>
                    <td className={tdClass}><code className="text-xs">{r.action}</code></td>
                    <td className={tdClass}><span className="text-xs text-ink-muted">{r.entity} {r.entity_id?.slice(0, 8)}</span></td>
                    <td className={tdClass}><code className="break-all text-xs text-ink-muted">{JSON.stringify(r.metadata)}</code></td>
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
