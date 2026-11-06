import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { Alert, Card, PageHeader, ProgressBar, Stat, buttonClass } from "@/components/portal/ui";
import { getProfile, requireUser } from "@/lib/portal/auth";
import { profileCompletion } from "@/lib/portal/progress";
import { formatDate } from "@/lib/portal/constants";
import type { Notification } from "@/lib/portal/types";

export const metadata = { title: "Dashboard" };

const notices: Record<string, string> = {
  verified: "Your email address is verified and your account is active.",
  "password-updated": "Your password was updated.",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { supabase, user } = await requireUser("/portal");
  const profile = await getProfile();
  const { notice } = await searchParams;
  if (!profile) {
    return <Alert tone="danger" title="Profile not found">Your account profile could not be loaded. Please sign out and sign in again, or contact GlobalPath.</Alert>;
  }

  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [academic, language, uploaded, verified, awaiting, corrections, applications, drafts, notifications, consultations] = await Promise.all([
    count(supabase.from("academic_qualifications").select("id", { count: "exact", head: true }).eq("student_id", user.id)),
    count(supabase.from("language_qualifications").select("id", { count: "exact", head: true }).eq("student_id", user.id)),
    count(supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_id", user.id).not("current_version_id", "is", null)),
    count(supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "verified")),
    count(supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_id", user.id).in("status", ["security_check", "pending_review", "under_review"])),
    count(supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_id", user.id).in("status", ["correction_required", "rejected"])),
    count(supabase.from("applications").select("id", { count: "exact", head: true }).eq("student_id", user.id).neq("status", "withdrawn")),
    count(supabase.from("applications").select("id", { count: "exact", head: true }).eq("student_id", user.id).in("status", ["draft", "missing_documents", "correction_required"])),
    supabase.from("notifications").select("*").eq("user_id", user.id).is("read_at", null).order("created_at", { ascending: false }).limit(5),
    supabase.from("consultation_requests").select("id, service, confirmed_for").eq("user_id", user.id).eq("status", "confirmed").gte("confirmed_for", new Date().toISOString()).order("confirmed_for").limit(3),
  ]);

  const completion = profileCompletion({ profile, academicCount: academic, languageCount: language, documentCount: uploaded });
  const firstMissing = completion.checks.find((c) => !c.done);

  const nextAction =
    corrections > 0
      ? { text: `${corrections} document${corrections > 1 ? "s need" : " needs"} your attention. Read the reviewer feedback and upload a replacement.`, href: "/portal/verification", cta: "Review feedback" }
      : firstMissing
        ? { text: `Complete your profile: ${firstMissing.label.toLowerCase()}.`, href: firstMissing.href, cta: "Continue profile" }
        : applications === 0
          ? { text: "Choose a programme and start preparing your first application.", href: "/portal/universities", cta: "Find programmes" }
          : drafts > 0
            ? { text: "You have an application that has not been submitted to GlobalPath yet.", href: "/portal/applications", cta: "Open applications" }
            : { text: "You are up to date. GlobalPath will notify you when there is an update.", href: "/portal/notifications", cta: "View notifications" };

  const unread = (notifications.data ?? []) as Notification[];

  return (
    <div className="grid gap-6">
      {notice && notices[notice] && <Alert tone="success">{notices[notice]}</Alert>}
      {profile.deletion_requested_at && (
        <Alert tone="warn" title="Account deletion requested">
          You asked GlobalPath to delete your account on {formatDate(profile.deletion_requested_at)}. Contact GlobalPath if this was a mistake.
        </Alert>
      )}
      <PageHeader
        title="Dashboard"
        intro={
          <>
            {profile.first_name ? `${profile.first_name} · ` : ""}Applicant ID <span className="font-medium tabular-nums text-ink">{profile.applicant_ref}</span>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="relative overflow-hidden rounded-2xl bg-navy p-5 text-white md:p-6">
          {/* The site's dotted route line, ending at the destination pin */}
          <svg className="pointer-events-none absolute bottom-0 right-6 hidden h-full w-1/2 sm:block" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
            <path d="M0 190 C 90 180, 150 200, 200 140 S 250 50, 262 40" stroke="#FDBE18" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="3 11" strokeLinecap="round" />
            <circle cx="262" cy="40" r="4" fill="#FDBE18" />
            <circle cx="262" cy="40" r="11" stroke="#FDBE18" strokeOpacity=".5" />
          </svg>
          <div className="relative max-w-md">
            <h2 className="font-display text-lg font-semibold">Recommended next step</h2>
            <p className="mt-2 text-white/80">{nextAction.text}</p>
            <Link href={nextAction.href} className={`${buttonClass.primary} mt-5`}>
              {nextAction.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <Card title="Profile completion">
          <ProgressBar value={completion.percent} label={`${completion.checks.filter((c) => c.done).length} of ${completion.checks.length} items complete`} />
          {firstMissing && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {completion.checks
                .filter((c) => !c.done)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="text-navy underline underline-offset-2">{c.label}</Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Applications" value={applications} href="/portal/applications" />
        <Stat label="Documents uploaded" value={uploaded} href="/portal/documents" />
        <Stat label="Documents verified" value={verified} hint="GlobalPath internal review" href="/portal/verification" />
        <Stat label="Awaiting review" value={awaiting} href="/portal/verification" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Unread notifications" actions={<Link href="/portal/notifications" className={`${buttonClass.link} text-sm`}>View all</Link>}>
          {unread.length === 0 ? (
            <p className="text-sm text-ink-muted">No unread notifications.</p>
          ) : (
            <ul className="divide-y divide-line">
              {unread.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-sm text-ink-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-ink-faint">{formatDate(n.created_at, true)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Upcoming consultations" actions={<Link href="/portal/consultations" className={`${buttonClass.link} text-sm`}>Consultations</Link>}>
          {(consultations.data ?? []).length === 0 ? (
            <div className="text-sm text-ink-muted">
              <p>No confirmed appointments. Requests become appointments only after GlobalPath confirms a time with you.</p>
              <Link href="/book-consultation" className={`${buttonClass.secondary} mt-4`}>Request a consultation</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {(consultations.data ?? []).map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <CalendarCheck className="mt-0.5 h-[18px] w-[18px] text-ink-faint" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-ink">{c.service}</span>
                    <span className="text-sm text-ink-muted">{formatDate(c.confirmed_for, true)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
