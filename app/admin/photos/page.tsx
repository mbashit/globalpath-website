import { SmartImage } from "@/components/SmartImage";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/portal/forms";
import { Badge, Card, PageHeader, inputClass, labelClass } from "@/components/portal/ui";
import { requireStaff } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";
import { photoSlots } from "@/lib/site-content";
import { resetPhotoAction, savePhotoAction } from "../content-actions";

export const metadata = { title: "Website photos" };

export default async function PhotosPage() {
  const { supabase } = await requireStaff("/admin/photos", "admin");
  const { data } = await supabase.from("site_images").select("key, src, alt, updated_at");
  const overrides = new Map((data ?? []).map((r) => [r.key as string, r as { src: string; alt: string; updated_at: string }]));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Website photos"
        intro="Replace the photos on the public website. Use JPG, PNG or WebP up to 5 MB; landscape photos around 1600 px wide work best. Changes go live as soon as you save."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {photoSlots.map((slot) => {
          const o = overrides.get(slot.key);
          const src = o?.src ?? slot.src;
          const alt = o?.alt ?? slot.alt;
          return (
            <Card key={slot.key} title={slot.label} description={slot.where} actions={o ? <Badge tone="info">Replaced</Badge> : <Badge>Original</Badge>}>
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-canvas ring-1 ring-line">
                <SmartImage src={src} alt={alt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
              </div>
              {o && <p className="mt-2 text-xs text-ink-faint">Replaced {formatDate(o.updated_at, true)}</p>}
              <ActionForm action={savePhotoAction} className="mt-4 grid gap-4">
                <input type="hidden" name="key" value={slot.key} />
                <div>
                  <label htmlFor={`photo-${slot.key}`} className={labelClass}>New photo</label>
                  <input
                    id={`photo-${slot.key}`}
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-navy-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy`}
                  />
                </div>
                <div>
                  <label htmlFor={`alt-${slot.key}`} className={labelClass}>Description</label>
                  <input id={`alt-${slot.key}`} name="alt" defaultValue={alt} maxLength={200} required className={inputClass} />
                  <p className="mt-1 text-sm text-ink-faint">What the photo shows, in a short sentence. Screen readers and search engines use it.</p>
                </div>
                <div>
                  <SubmitButton variant="navy" pendingText="Uploading…">Save</SubmitButton>
                </div>
              </ActionForm>
              {o && (
                <form action={resetPhotoAction} className="mt-2">
                  <input type="hidden" name="key" value={slot.key} />
                  <ConfirmSubmit variant="link" message={`Put the original ${slot.label} photo back?`} className="text-sm">
                    Restore original photo
                  </ConfirmSubmit>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
