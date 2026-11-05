import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/portal/forms";
import { Card, Field, PageHeader, SelectField, TableWrap, tdClass, thClass } from "@/components/portal/ui";
import { setStaffRoleAction } from "../actions";
import { requireStaff } from "@/lib/portal/auth";
import { formatDate } from "@/lib/portal/constants";

export const metadata = { title: "Staff & assignments" };

export default async function StaffPage() {
  const { supabase } = await requireStaff("/admin/staff", "admin");
  const [{ data: staff }, { data: assignments }] = await Promise.all([
    supabase.from("staff_roles").select("user_id, role, granted_at, profiles!staff_roles_user_id_fkey(first_name, last_name, email)").order("granted_at"),
    supabase
      .from("reviewer_assignments")
      .select("reviewer_id, student_id, created_at, profiles!reviewer_assignments_student_id_fkey(first_name, last_name, applicant_ref)")
      .eq("active", true),
  ]);
  type StaffRow = { user_id: string; role: string; granted_at: string; profiles: { first_name: string; last_name: string; email: string } | null };
  type AssignmentRow = { reviewer_id: string; student_id: string; profiles: { first_name: string; last_name: string; applicant_ref: string } | null };
  const staffRows = (staff ?? []) as unknown as StaffRow[];
  const assignmentRows = (assignments ?? []) as unknown as AssignmentRow[];

  return (
    <div className="grid gap-6">
      <PageHeader title="Staff & assignments" intro="Staff must first register a normal account, then you grant a role here. Staff tools unlock only after they set up two-step verification." />
      <Card title="Grant, change or remove a role">
        <ActionForm action={setStaffRoleAction} className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end" resetOnSuccess>
          <Field label="Account email" name="email" type="email" required />
          <SelectField
            label="Role"
            name="role"
            placeholder="Remove staff access"
            options={[
              { value: "reviewer", label: "Reviewer" },
              { value: "admin", label: "Administrator" },
            ]}
          />
          <SubmitButton variant="navy">Save</SubmitButton>
        </ActionForm>
      </Card>
      <Card title="Staff">
        <TableWrap>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Since</th>
                <th className={thClass}>Assigned students</th>
              </tr>
            </thead>
            <tbody>
              {staffRows.map((s) => {
                const mine = assignmentRows.filter((a) => a.reviewer_id === s.user_id);
                return (
                  <tr key={s.user_id}>
                    <td className={tdClass}>
                      {`${s.profiles?.first_name ?? ""} ${s.profiles?.last_name ?? ""}`.trim() || "—"}
                      <span className="block break-all text-xs text-ink-faint">{s.profiles?.email}</span>
                    </td>
                    <td className={tdClass}>{s.role === "admin" ? "Administrator" : "Reviewer"}</td>
                    <td className={tdClass}>{formatDate(s.granted_at)}</td>
                    <td className={tdClass}>
                      {s.role === "admin" ? (
                        <span className="text-ink-faint">All students</span>
                      ) : mine.length === 0 ? (
                        <span className="text-ink-faint">None</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1.5">
                          {mine.map((a) => (
                            <li key={a.student_id}>
                              <Link href={`/admin/students/${a.student_id}`} className="rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy hover:underline">
                                {a.profiles?.applicant_ref}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
        <p className="mt-4 text-sm text-ink-muted">Assign reviewers from each student&apos;s page.</p>
      </Card>
    </div>
  );
}
