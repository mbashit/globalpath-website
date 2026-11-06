import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/portal/forms";
import { Badge, Card, EmptyState, Field, PageHeader, SelectField, TextAreaField, buttonClass, inputClass, labelClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";
import { deleteTestimonialAction, saveTestimonialAction, setTestimonialStatusAction } from "../content-actions";

export const metadata = { title: "Testimonials" };

type Story = {
  id: string;
  quote: string;
  name: string;
  context: string;
  destination: string;
  image_src: string | null;
  status: "pending" | "published" | "hidden";
  sort_order: number;
  submitted_by: string | null;
  created_at: string;
};

const statusOptions = [
  { value: "published", label: "Published on the website" },
  { value: "hidden", label: "Hidden" },
  { value: "pending", label: "Waiting for approval" },
];

function StoryFields({ story }: { story?: Story }) {
  const key = story?.id ?? "new";
  return (
    <>
      {story && <input type="hidden" name="id" value={story.id} />}
      <TextAreaField label="Testimonial" name="quote" id={`quote-${key}`} defaultValue={story?.quote} maxLength={800} required className="sm:col-span-2" />
      <Field label="Name as shown" name="name" id={`name-${key}`} defaultValue={story?.name} maxLength={80} required hint={'Use first name and initial, e.g. "Chinedu O."'} />
      <Field label="Who they are" name="context" id={`context-${key}`} defaultValue={story?.context} maxLength={120} optional hint={'e.g. "Master\'s student · Lagos, Nigeria"'} />
      <Field label="Destination" name="destination" id={`dest-${key}`} defaultValue={story?.destination} maxLength={60} optional />
      <Field label="Order" name="sort_order" id={`order-${key}`} type="number" min={0} max={9999} defaultValue={story?.sort_order ?? 100} hint="Lower numbers show first" />
      <SelectField label="Status" name="status" id={`status-${key}`} options={statusOptions} defaultValue={story?.status ?? "published"} placeholder="Choose…" />
      <div>
        <label htmlFor={`photo-${key}`} className={labelClass}>
          Portrait photo <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input id={`photo-${key}`} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
        {story?.image_src && (
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="remove_photo" className="h-4 w-4 accent-navy" /> Remove the current photo (show initials instead)
          </label>
        )}
      </div>
    </>
  );
}

function StoryRow({ story }: { story: Story }) {
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-ink">“{story.quote}”</p>
          <p className="mt-2 text-sm text-ink-muted">
            <span className="font-medium text-ink">{story.name}</span>
            {story.context && ` · ${story.context}`}
            {story.destination && ` · ${story.destination}`}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            {story.submitted_by ? "Submitted by a student" : "Added by GlobalPath"} · {formatDate(story.created_at)}
            {story.status === "published" && ` · order ${story.sort_order}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {story.status !== "published" && (
            <form action={setTestimonialStatusAction}>
              <input type="hidden" name="id" value={story.id} />
              <input type="hidden" name="status" value="published" />
              <SubmitButton variant="navy" pendingText="Publishing…">{story.status === "pending" ? "Approve and publish" : "Publish"}</SubmitButton>
            </form>
          )}
          {story.status !== "hidden" && (
            <form action={setTestimonialStatusAction}>
              <input type="hidden" name="id" value={story.id} />
              <input type="hidden" name="status" value="hidden" />
              <SubmitButton variant="secondary" pendingText="Hiding…">Hide</SubmitButton>
            </form>
          )}
          <form action={deleteTestimonialAction}>
            <input type="hidden" name="id" value={story.id} />
            <ConfirmSubmit message={`Delete the testimonial from ${story.name}? This cannot be undone.`}>Delete</ConfirmSubmit>
          </form>
        </div>
      </div>
      <details className="mt-3">
        <summary className={`${buttonClass.link} inline-flex min-h-[36px] cursor-pointer items-center text-sm`}>Edit</summary>
        <ActionForm action={saveTestimonialAction} className="mt-4 grid gap-4 rounded-xl bg-canvas p-4 sm:grid-cols-2">
          <StoryFields story={story} />
          <div className="sm:col-span-2">
            <SubmitButton variant="navy">Save changes</SubmitButton>
          </div>
        </ActionForm>
      </details>
    </li>
  );
}

export default async function TestimonialsPage() {
  const { supabase } = await requireStaff("/admin/testimonials", "admin");
  const { data } = await supabase
    .from("site_testimonials")
    .select("id, quote, name, context, destination, image_src, status, sort_order, submitted_by, created_at")
    .order("sort_order")
    .order("created_at", { ascending: false });
  const stories = (data ?? []) as Story[];
  const groups = [
    { status: "pending", title: "Waiting for approval", description: "Stories students sent from their portal. Only publish what you have checked and have permission to share.", empty: "No stories are waiting." },
    { status: "published", title: "Published", description: "Shown on the homepage and the Success Stories page.", empty: "Nothing is published, so the testimonials section is hidden on the website." },
    { status: "hidden", title: "Hidden", description: "Kept for later; not shown on the website.", empty: "No hidden testimonials." },
  ] as const;

  return (
    <div className="grid gap-6">
      <PageHeader title="Testimonials" intro="Approve stories from students, add your own and choose what the website shows. Changes go live as soon as you save." />
      {groups.map((g) => {
        const list = stories.filter((s) => s.status === g.status);
        return (
          <Card key={g.status} title={g.title} description={g.description} actions={<Badge tone={g.status === "pending" && list.length ? "warn" : "neutral"}>{list.length}</Badge>}>
            {list.length === 0 ? (
              <EmptyState title={g.empty} />
            ) : (
              <ul className="divide-y divide-line">
                {list.map((s) => (
                  <StoryRow key={s.id} story={s} />
                ))}
              </ul>
            )}
          </Card>
        );
      })}
      <Card title="Add a testimonial" description="For stories clients sent you by email or WhatsApp. Only publish real stories shared with the person's permission.">
        <ActionForm action={saveTestimonialAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
          <StoryFields />
          <div className="sm:col-span-2">
            <SubmitButton variant="navy">Add testimonial</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
