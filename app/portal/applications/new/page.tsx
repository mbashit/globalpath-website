import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Card, EmptyState, Field, PageHeader, TextAreaField, buttonClass, inputClass, labelClass } from "@/components/portal/ui";
import { createApplicationAction } from "../../actions";
import { requireUser } from "@/lib/portal/auth";
import { degreeLevels } from "@/lib/portal/constants";
import { isUuid } from "@/lib/portal/validation";
import type { Course } from "@/lib/portal/types";

export const metadata = { title: "New Application" };

export default async function NewApplicationPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { supabase } = await requireUser("/portal/applications/new");
  const { course } = await searchParams;
  const { data } = await supabase
    .from("courses")
    .select("id, name, degree_level, intake, universities!inner(name, country)")
    .eq("published", true)
    .order("name");
  const courses = (data ?? []) as unknown as (Pick<Course, "id" | "name" | "degree_level" | "intake"> & { universities: { name: string; country: string } })[];
  const selected = isUuid(course) && courses.some((c) => c.id === course) ? course : "";

  return (
    <div className="grid gap-6">
      <PageHeader title="New application" intro="Create a preparation record for one programme. You can attach documents after it is created." />
      <Card>
        {courses.length === 0 ? (
          <EmptyState title="No verified programmes are available yet">
            GlobalPath has not published any programmes yet. <Link href="/book-consultation" className={buttonClass.link}>Request a consultation</Link> to discuss your options.
          </EmptyState>
        ) : (
          <ActionForm action={createApplicationAction} className="grid gap-5">
            <div>
              <label htmlFor="course_id" className={labelClass}>Programme</label>
              <select id="course_id" name="course_id" defaultValue={selected} required className={inputClass}>
                <option value="">Select a programme…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} – {c.universities.name} ({c.universities.country}) · {degreeLevels[c.degree_level]}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Intended intake" name="intake" optional maxLength={100} placeholder="e.g. Winter semester 2027/28" />
            <TextAreaField label="Notes for your GlobalPath adviser" name="student_notes" optional maxLength={4000} />
            <div>
              <SubmitButton pendingText="Creating…">Create application</SubmitButton>
            </div>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}
