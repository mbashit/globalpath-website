import Link from "next/link";
import { Alert, Card, EmptyState, PageHeader, StatusBadge, buttonClass } from "@/components/portal/ui";
import { requireUser } from "@/lib/portal/auth";
import { consultationStatuses, formatDate } from "@/lib/portal/constants";
import type { ConsultationRequest } from "@/lib/portal/types";

export const metadata = { title: "Consultation History" };

export default async function ConsultationsPage() {
  const { supabase, user } = await requireUser("/portal/consultations");
  const { data } = await supabase.from("consultation_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const requests = (data ?? []) as ConsultationRequest[];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Consultations"
        intro="Requests you send while signed in appear here. Your details are filled in for you on the request form."
        actions={<Link href="/book-consultation" className={buttonClass.primary}>Request a consultation</Link>}
      />
      <Alert tone="info">
        A request is not an appointment. It becomes a confirmed appointment only when GlobalPath agrees a time with you. Requests sent before you created an account, or while signed out, are not shown here.
      </Alert>
      <Card>
        {requests.length === 0 ? (
          <EmptyState title="No consultation requests yet" />
        ) : (
          <ul className="divide-y divide-line">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{r.service}</p>
                  <p className="text-sm text-ink-muted">
                    Requested {formatDate(r.created_at)}
                    {r.destination ? ` · ${r.destination}` : ""}
                    {r.preferred_date ? ` · preferred date ${formatDate(r.preferred_date)}` : ""}
                  </p>
                  {r.status === "confirmed" && r.confirmed_for && <p className="mt-1 text-sm font-semibold text-[#11643A]">Confirmed for {formatDate(r.confirmed_for, true)}</p>}
                  {r.staff_note && <p className="mt-1 text-sm text-ink-muted">Note from GlobalPath: {r.staff_note}</p>}
                </div>
                <StatusBadge status={r.status} map={consultationStatuses} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
