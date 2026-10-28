import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/portal/forms";
import { Card, EmptyState, Field, PageHeader, SelectField, buttonClass } from "@/components/portal/ui";
import { deleteLanguageAction, deleteQualificationAction, saveLanguageAction, saveQualificationAction } from "../actions";
import { requireUser } from "@/lib/portal/auth";
import { formatDate, graduationStatuses, languageTests, qualificationLevels } from "@/lib/portal/constants";
import type { AcademicQualification, LanguageQualification } from "@/lib/portal/types";

export const metadata = { title: "Educational History" };

const levelOptions = Object.entries(qualificationLevels).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(graduationStatuses).map(([value, label]) => ({ value, label }));
const testOptions = languageTests.map((t) => ({ value: t, label: t === "Goethe" ? "Goethe-Zertifikat" : t }));

function QualificationForm({ q }: { q?: AcademicQualification }) {
  return (
    <ActionForm action={saveQualificationAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!q}>
      {q && <input type="hidden" name="id" value={q.id} />}
      <SelectField label="Level" name="level" options={levelOptions} defaultValue={q?.level ?? ""} required />
      <Field label="Institution" name="institution" defaultValue={q?.institution} required maxLength={200} />
      <Field label="Country" name="country" defaultValue={q?.country} required maxLength={100} />
      <Field label="Qualification" name="qualification_name" defaultValue={q?.qualification_name} required maxLength={200} placeholder="e.g. WASSCE, BSc, HND" />
      <Field label="Field of study" name="field_of_study" defaultValue={q?.field_of_study ?? ""} optional maxLength={200} />
      <SelectField label="Graduation status" name="graduation_status" options={statusOptions} defaultValue={q?.graduation_status ?? ""} required />
      <Field label="Start date" name="start_date" type="date" defaultValue={q?.start_date ?? ""} optional />
      <Field label="End / graduation date" name="end_date" type="date" defaultValue={q?.end_date ?? ""} optional />
      <Field label="Grade or GPA" name="grade" defaultValue={q?.grade ?? ""} optional maxLength={50} placeholder="e.g. 3.6, Second Class Upper, B2" />
      <Field label="Grading system" name="grading_system" defaultValue={q?.grading_system ?? ""} optional maxLength={100} placeholder="e.g. 5.0 scale, A1–F9, 1.0–4.0" />
      <div className="sm:col-span-2">
        <SubmitButton>{q ? "Save changes" : "Add qualification"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function LanguageForm({ l, certificates }: { l?: LanguageQualification; certificates: { id: string; title: string }[] }) {
  return (
    <ActionForm action={saveLanguageAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!l}>
      {l && <input type="hidden" name="id" value={l.id} />}
      <SelectField label="Test / certificate" name="test" options={testOptions} defaultValue={l?.test ?? ""} required />
      <Field label="Name, if Other" name="test_name_other" defaultValue={l?.test_name_other ?? ""} optional maxLength={100} />
      <Field label="Language" name="language" defaultValue={l?.language ?? "English"} required maxLength={60} />
      <Field label="Overall score or level" name="result" defaultValue={l?.result} required maxLength={60} placeholder="e.g. 7.0, 95, TDN 4, B2" />
      <Field label="Section scores" name="sub_scores" defaultValue={l?.sub_scores ?? ""} optional maxLength={200} placeholder="e.g. L 7.5 · R 7.0 · W 6.5 · S 7.0" />
      <Field label="Test date" name="test_date" type="date" defaultValue={l?.test_date ?? ""} optional />
      <SelectField
        label="Certificate (from My Documents)"
        name="certificate_document_id"
        options={certificates.map((c) => ({ value: c.id, label: c.title }))}
        defaultValue={l?.certificate_document_id ?? ""}
        placeholder="Not linked"
        optional
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <SubmitButton>{l ? "Save changes" : "Add language qualification"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function EducationPage() {
  const { supabase, user } = await requireUser("/portal/education");
  const [{ data: academic }, { data: language }, { data: certs }] = await Promise.all([
    supabase.from("academic_qualifications").select("*").eq("student_id", user.id).order("end_date", { ascending: false, nullsFirst: true }),
    supabase.from("language_qualifications").select("*").eq("student_id", user.id).order("test_date", { ascending: false }),
    supabase.from("documents").select("id, title").eq("owner_id", user.id).eq("category", "language_certificate").not("current_version_id", "is", null),
  ]);
  const qualifications = (academic ?? []) as AcademicQualification[];
  const languages = (language ?? []) as LanguageQualification[];
  const certificates = (certs ?? []) as { id: string; title: string }[];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Educational history"
        intro="Add every qualification you hold or are studying for. Enter grades exactly as shown on your certificates; GlobalPath does not convert grades."
      />

      <Card title="Academic qualifications" description="Secondary school, diplomas, degrees and other qualifications.">
        {qualifications.length === 0 ? (
          <EmptyState title="No qualifications yet">Add your secondary school qualification first, then any diplomas or degrees.</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {qualifications.map((q) => (
              <li key={q.id} className="rounded-xl ring-1 ring-line">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4">
                    <span>
                      <span className="block font-semibold text-ink">{q.qualification_name}{q.field_of_study ? ` – ${q.field_of_study}` : ""}</span>
                      <span className="block text-sm text-ink-muted">
                        {q.institution}, {q.country} · {qualificationLevels[q.level]} · {graduationStatuses[q.graduation_status as keyof typeof graduationStatuses]}
                      </span>
                      <span className="block text-sm text-ink-faint">
                        {formatDate(q.start_date)} – {formatDate(q.end_date)}
                        {q.grade ? ` · Grade: ${q.grade}${q.grading_system ? ` (${q.grading_system})` : ""}` : ""}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy">
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                    </span>
                  </summary>
                  <div className="border-t border-line p-4">
                    <QualificationForm q={q} />
                    <form action={deleteQualificationAction} className="mt-4">
                      <input type="hidden" name="id" value={q.id} />
                      <ConfirmSubmit message="Delete this qualification?">
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-5 rounded-xl bg-canvas p-4" open={qualifications.length === 0}>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-navy">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add a qualification
          </summary>
          <div className="mt-4">
            <QualificationForm />
          </div>
        </details>
      </Card>

      <Card id="language" title="Language qualifications" description="IELTS, TOEFL, TestDaF, Goethe-Zertifikat and others.">
        {languages.length === 0 ? (
          <EmptyState title="No language qualifications yet">If you have not taken a test yet, you can leave this empty for now.</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {languages.map((l) => (
              <li key={l.id} className="rounded-xl ring-1 ring-line">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4">
                    <span>
                      <span className="block font-semibold text-ink">
                        {l.test === "Other" ? l.test_name_other : l.test} · {l.language}: {l.result}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        {l.sub_scores ? `${l.sub_scores} · ` : ""}Taken {formatDate(l.test_date)} · {l.certificate_document_id ? "Certificate linked" : "No certificate linked"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy">
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                    </span>
                  </summary>
                  <div className="border-t border-line p-4">
                    <LanguageForm l={l} certificates={certificates} />
                    <form action={deleteLanguageAction} className="mt-4">
                      <input type="hidden" name="id" value={l.id} />
                      <ConfirmSubmit message="Delete this language qualification?">
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-5 rounded-xl bg-canvas p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-navy">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add a language qualification
          </summary>
          <div className="mt-4">
            <LanguageForm certificates={certificates} />
          </div>
        </details>
        <p className="mt-4 text-sm text-ink-muted">
          To attach a certificate, first upload it under <Link href="/portal/documents" className={buttonClass.link}>My Documents</Link> with the category
          &ldquo;Language proficiency certificate&rdquo;.
        </p>
      </Card>
    </div>
  );
}
