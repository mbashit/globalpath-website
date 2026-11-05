import { Plus } from "lucide-react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/portal/forms";
import { Alert, Badge, Card, EmptyState, Field, PageHeader, SelectField, TextAreaField } from "@/components/portal/ui";
import { deleteCourseAction, deleteUniversityAction, saveCourseAction, saveUniversityAction } from "../actions";
import { requireStaff } from "@/lib/portal/auth";
import { degreeLevels, formatDate } from "@/lib/portal/constants";
import type { Course, University } from "@/lib/portal/types";

export const metadata = { title: "Universities & courses" };

const today = () => new Date().toISOString().slice(0, 10);

function Published({ checked }: { checked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink sm:col-span-2">
      <input type="checkbox" name="published" defaultChecked={checked} className="h-5 w-5 accent-[#252B83]" />
      Published (visible to students)
    </label>
  );
}

function UniversityForm({ u }: { u?: University }) {
  return (
    <ActionForm action={saveUniversityAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!u}>
      {u && <input type="hidden" name="id" value={u.id} />}
      <Field label="Official name" name="name" defaultValue={u?.name} required maxLength={200} />
      <Field label="Country" name="country" defaultValue={u?.country} required maxLength={100} />
      <Field label="City" name="city" defaultValue={u?.city ?? ""} optional maxLength={100} />
      <Field label="Website" name="website_url" type="url" defaultValue={u?.website_url ?? ""} optional placeholder="https://" />
      <Field label="Official source checked" name="source_url" type="url" defaultValue={u?.source_url} required placeholder="https://" />
      <Field label="Date checked" name="verified_on" type="date" defaultValue={u?.verified_on ?? today()} required />
      <TextAreaField label="Internal notes" name="notes" defaultValue={u?.notes ?? ""} optional className="sm:col-span-2" rows={2} />
      <Published checked={u?.published} />
      <div className="sm:col-span-2">
        <SubmitButton variant="navy">{u ? "Save university" : "Add university"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function CourseForm({ universityId, c }: { universityId: string; c?: Course }) {
  return (
    <ActionForm action={saveCourseAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!c}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="university_id" value={universityId} />
      <Field label="Programme name" name="name" defaultValue={c?.name} required maxLength={200} />
      <SelectField label="Degree level" name="degree_level" defaultValue={c?.degree_level ?? ""} required options={Object.entries(degreeLevels).map(([v, l]) => ({ value: v, label: l }))} />
      <Field label="Field of study" name="field_of_study" defaultValue={c?.field_of_study ?? ""} optional />
      <Field label="Language of instruction" name="language_of_instruction" defaultValue={c?.language_of_instruction ?? ""} optional />
      <Field label="Duration" name="duration" defaultValue={c?.duration ?? ""} optional placeholder="As stated by the university" />
      <Field label="Intake" name="intake" defaultValue={c?.intake ?? ""} optional placeholder="As stated by the university" />
      <Field label="Application route" name="application_route" defaultValue={c?.application_route ?? ""} optional placeholder="e.g. Directly to university, uni-assist, UCAS" />
      <Field label="Official programme page" name="source_url" type="url" defaultValue={c?.source_url} required placeholder="https://" />
      <Field label="Date checked" name="verified_on" type="date" defaultValue={c?.verified_on ?? today()} required />
      <TextAreaField label="Requirements summary" name="requirements_summary" defaultValue={c?.requirements_summary ?? ""} optional rows={3} className="sm:col-span-2" hint="Copy only what the official page states. Leave empty if unsure." />
      <Published checked={c?.published} />
      <div className="sm:col-span-2">
        <SubmitButton variant="navy">{c ? "Save course" : "Add course"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function AdminUniversitiesPage() {
  const { supabase } = await requireStaff("/admin/universities", "admin");
  const { data } = await supabase.from("universities").select("*, courses(*)").order("name");
  const unis = (data ?? []) as (University & { courses: Course[] })[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Universities & courses" />
      <Alert tone="warn" title="Publish only verified information">
        Enter only details you have checked on the institution&apos;s official website, and record that page and the date. Do not imply a partnership, and do not add
        deadlines, fees or requirements you have not confirmed.
      </Alert>
      <Card title="Add a university">
        <details>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-navy"><Plus className="h-4 w-4" aria-hidden="true" /> New university</summary>
          <div className="mt-4"><UniversityForm /></div>
        </details>
      </Card>
      {unis.length === 0 ? (
        <EmptyState title="No universities yet" />
      ) : (
        unis.map((u) => (
          <Card
            key={u.id}
            title={u.name}
            description={`${[u.city, u.country].filter(Boolean).join(", ")} · checked ${formatDate(u.verified_on)}`}
            actions={<Badge tone={u.published ? "success" : "neutral"}>{u.published ? "Published" : "Hidden"}</Badge>}
          >
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-navy">Edit university</summary>
              <div className="mt-4"><UniversityForm u={u} /></div>
              <form action={deleteUniversityAction} className="mt-3">
                <input type="hidden" name="id" value={u.id} />
                <ConfirmSubmit message="Delete this university and all its courses? Applications keep their programme name.">Delete university</ConfirmSubmit>
              </form>
            </details>
            <ul className="mt-4 grid gap-2">
              {u.courses.map((c) => (
                <li key={c.id} className="rounded-xl bg-canvas p-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
                      <span><span className="font-semibold text-ink">{c.name}</span> · {degreeLevels[c.degree_level]}</span>
                      <Badge tone={c.published ? "success" : "neutral"}>{c.published ? "Published" : "Hidden"}</Badge>
                    </summary>
                    <div className="mt-4"><CourseForm universityId={u.id} c={c} /></div>
                    <form action={deleteCourseAction} className="mt-3">
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmit message="Delete this course?">Delete course</ConfirmSubmit>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
            <details className="mt-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-navy"><Plus className="h-4 w-4" aria-hidden="true" /> Add course</summary>
              <div className="mt-4"><CourseForm universityId={u.id} /></div>
            </details>
          </Card>
        ))
      )}
    </div>
  );
}
