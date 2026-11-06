import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Badge, Card, Field, PageHeader, TextAreaField } from "@/components/portal/ui";
import { getProfile, requireUser } from "@/lib/portal/auth";
import { formatDate, type Tone } from "@/lib/portal/constants";
import { destinations } from "@/data/destinations";
import { submitStoryAction } from "../actions";

export const metadata = { title: "Share your story" };

const statusBadge: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Waiting for review", tone: "warn" },
  published: { label: "On the website", tone: "success" },
  hidden: { label: "Not published", tone: "neutral" },
};

export default async function ShareStoryPage() {
  const { supabase, user } = await requireUser("/portal/share-story");
  const [profile, { data }] = await Promise.all([
    getProfile(),
    supabase.from("site_testimonials").select("id, quote, status, created_at").eq("submitted_by", user.id).order("created_at", { ascending: false }),
  ]);
  const mine = (data ?? []) as { id: string; quote: string; status: string; created_at: string }[];
  const suggestedName = profile?.first_name ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name[0]}.` : ""}` : "";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Share your story"
        intro="Tell other students and families how GlobalPath helped you. We read every story before it appears on the website, and we may shorten it."
      />
      <Card>
        <ActionForm action={submitStoryAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
          <TextAreaField label="Your story" name="quote" maxLength={800} required className="sm:col-span-2" hint="What did we help with, and how did it go? 20 to 800 characters." />
          <Field label="Name to show" name="name" defaultValue={suggestedName} maxLength={80} required hint="First name and initial is enough" />
          <Field label="About you" name="context" maxLength={120} optional hint={'e.g. "Master\'s student · Lagos, Nigeria"'} />
          <div>
            <label htmlFor="f-destination" className="text-sm font-semibold text-ink">
              Destination <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <select id="f-destination" name="destination" defaultValue="" className="mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base text-ink focus:border-navy focus:outline-none focus:ring-4 focus:ring-navy/10">
              <option value="">Choose…</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-3 text-sm text-ink sm:col-span-2">
            <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-navy" />
            I agree that GlobalPath Education may publish this story with the name above on its website.
          </label>
          <div className="sm:col-span-2">
            <SubmitButton variant="navy" pendingText="Sending…">Send my story</SubmitButton>
          </div>
        </ActionForm>
      </Card>
      {mine.length > 0 && (
        <Card title="Stories you sent">
          <ul className="divide-y divide-line">
            {mine.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-ink">“{s.quote}”</p>
                  <p className="mt-1 text-sm text-ink-faint">Sent {formatDate(s.created_at)}</p>
                </div>
                <Badge tone={statusBadge[s.status]?.tone ?? "neutral"}>{statusBadge[s.status]?.label ?? s.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
