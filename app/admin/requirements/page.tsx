import { Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Card, EmptyState, Field, PageHeader, SelectField } from "@/components/portal/ui";
import { addRequirementAction, deleteRequirementAction } from "../actions";
import { requireStaff } from "@/lib/portal/auth";
import { degreeLevels, type DegreeLevel } from "@/lib/portal/constants";

export const metadata = { title: "Document requirements" };

export default async function RequirementsPage() {
  const { supabase } = await requireStaff("/admin/requirements", "admin");
  const [{ data: reqs }, { data: cats }] = await Promise.all([
    supabase.from("document_requirements").select("id, degree_level, category, required, notes").order("degree_level"),
    supabase.from("document_categories").select("code, label").eq("active", true).order("sort_order"),
  ]);
  const label = (code: string) => (cats ?? []).find((c) => c.code === code)?.label ?? code;
  const grouped = Object.keys(degreeLevels).map((level) => ({ level: level as DegreeLevel, items: (reqs ?? []).filter((r) => r.degree_level === level) }));

  return (
    <div className="grid gap-6">
      <PageHeader title="Document requirements" intro="The checklist students see on applications for each degree level. These are GlobalPath's preparation checklists, not official university requirements." />
      <Card title="Add or update a requirement">
        <ActionForm action={addRequirementAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
          <SelectField label="Degree level" name="degree_level" required options={Object.entries(degreeLevels).map(([v, l]) => ({ value: v, label: l }))} />
          <SelectField label="Document category" name="category" required options={(cats ?? []).map((c) => ({ value: c.code, label: c.label }))} />
          <Field label="Note for students" name="notes" optional maxLength={500} className="sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm font-semibold text-ink sm:col-span-2">
            <input type="checkbox" name="required" defaultChecked className="h-5 w-5 accent-[#252B83]" /> Required (untick for &ldquo;if applicable&rdquo;)
          </label>
          <div className="sm:col-span-2"><SubmitButton variant="navy">Save requirement</SubmitButton></div>
        </ActionForm>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {grouped.map((g) => (
          <Card key={g.level} title={degreeLevels[g.level]}>
            {g.items.length === 0 ? (
              <EmptyState title="No checklist set" />
            ) : (
              <ul className="divide-y divide-line">
                {g.items.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 py-2 text-sm">
                    <span>
                      {label(r.category)} {!r.required && <span className="text-ink-faint">(if applicable)</span>}
                      {r.notes && <span className="block text-xs text-ink-faint">{r.notes}</span>}
                    </span>
                    <form action={deleteRequirementAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-[#FFF1EC] hover:text-[#9A2E14]" aria-label={`Remove ${label(r.category)}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
