import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Alert, Card, EmptyState, Field, PageHeader, SelectField, StatusBadge } from "@/components/portal/ui";
import { updateConsultationAction } from "../actions";
import { requireStaff } from "@/lib/portal/auth";
import { consultationStatuses, formatDate } from "@/lib/portal/constants";
import type { ConsultationRequest } from "@/lib/portal/types";

export const metadata = { title: "Consultations" };

export default async function AdminConsultationsPage() {
  const { supabase } = await requireStaff("/admin/consultations");
  const { data } = await supabase
    .from("consultation_requests")
    .select("*, profiles!consultation_requests_user_id_fkey(first_name, last_name, applicant_ref, email, phone)")
    .order("created_at", { ascending: false })
    .limit(200);
  type Row = ConsultationRequest & { profiles: { first_name: string; last_name: string; applicant_ref: string; email: string; phone: string | null } | null };
  const rows = (data ?? []) as Row[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Consultation requests" />
      <Alert tone="info">
        Only requests sent by signed-in students appear here. Requests from visitors keep going to the existing form-delivery inbox. Times are in UTC.
      </Alert>
      {rows.length === 0 ? (
        <EmptyState title="No portal consultation requests" />
      ) : (
        <ul className="grid gap-4">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{r.service}{r.destination ? ` · ${r.destination}` : ""}</p>
                    <p className="text-sm text-ink-muted">
                      <Link href={`/admin/students/${r.user_id}`} className="font-semibold text-navy hover:underline">
                        {r.profiles?.first_name} {r.profiles?.last_name} ({r.profiles?.applicant_ref})
                      </Link>{" "}
                      · {r.profiles?.email}
                      {r.profiles?.phone ? ` · ${r.profiles.phone}` : ""}
                    </p>
                    <p className="text-sm text-ink-faint">
                      Requested {formatDate(r.created_at, true)}
                      {r.preferred_date ? ` · prefers ${formatDate(r.preferred_date)}` : ""}
                    </p>
                    {r.message && <p className="mt-2 whitespace-pre-line text-sm text-ink">{r.message}</p>}
                  </div>
                  <StatusBadge status={r.status} map={consultationStatuses} />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-navy">Update</summary>
                  <ActionForm action={updateConsultationAction} className="mt-3 grid gap-4 sm:grid-cols-2">
                    <input type="hidden" name="id" value={r.id} />
                    <SelectField label="Status" name="status" defaultValue={r.status} options={Object.entries(consultationStatuses).map(([v, s]) => ({ value: v, label: s.label }))} required />
                    <Field label="Confirmed date & time (UTC)" name="confirmed_for" type="datetime-local" defaultValue={r.confirmed_for ? r.confirmed_for.slice(0, 16) : ""} hint="Required when confirming" />
                    <Field label="Note to student" name="staff_note" defaultValue={r.staff_note ?? ""} maxLength={1000} className="sm:col-span-2" optional />
                    <div className="sm:col-span-2">
                      <SubmitButton variant="navy">Save</SubmitButton>
                    </div>
                  </ActionForm>
                </details>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
