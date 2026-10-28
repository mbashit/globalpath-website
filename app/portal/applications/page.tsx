import Link from "next/link";
import { Plus } from "lucide-react";
import { Alert, Card, EmptyState, PageHeader, StatusBadge, TableWrap, buttonClass, tdClass, thClass } from "@/components/portal/ui";
import { requireUser } from "@/lib/portal/auth";
import { applicationStatuses, degreeLevels, formatDate } from "@/lib/portal/constants";
import type { Application } from "@/lib/portal/types";

export const metadata = { title: "My Applications" };

export default async function ApplicationsPage() {
  const { supabase, user } = await requireUser("/portal/applications");
  const { data } = await supabase
    .from("applications")
    .select("*, application_documents(count)")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });
  const apps = (data ?? []) as (Application & { application_documents: { count: number }[] })[];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="My applications"
        intro="Prepare each application with GlobalPath, attach your documents and submit it for GlobalPath's internal review."
        actions={
          <Link href="/portal/applications/new" className={buttonClass.primary}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New application
          </Link>
        }
      />
      <Alert tone="info">
        These records track GlobalPath&apos;s preparation and review. Submitting here does <strong>not</strong> send anything to a university or to uni-assist, and admission decisions are made only by the institutions.
      </Alert>
      <Card>
        {apps.length === 0 ? (
          <EmptyState title="No applications yet" action={<Link href="/portal/universities" className={buttonClass.primary}>Find a programme</Link>}>
            Start by choosing a programme from the verified listings.
          </EmptyState>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Reference</th>
                  <th className={thClass}>Programme</th>
                  <th className={thClass}>Documents</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td className={tdClass}>
                      <Link href={`/portal/applications/${a.id}`} className="font-semibold text-navy underline underline-offset-2">{a.reference}</Link>
                    </td>
                    <td className={tdClass}>
                      {a.programme_snapshot || "—"}
                      {a.degree_level && <span className="block text-xs text-ink-faint">{degreeLevels[a.degree_level]}</span>}
                    </td>
                    <td className={tdClass}>{a.application_documents?.[0]?.count ?? 0}</td>
                    <td className={tdClass}><StatusBadge status={a.status} map={applicationStatuses} /></td>
                    <td className={tdClass}>{formatDate(a.updated_at)}</td>
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
