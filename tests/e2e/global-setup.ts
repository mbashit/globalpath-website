import { mkdirSync } from "node:fs";
import { admin, createConfirmedUser, saveAccounts } from "./accounts";

export default async function globalSetup() {
  mkdirSync("test-results", { recursive: true });
  const run = Date.now().toString(36);
  const student = await createConfirmedUser(`gp-e2e-student-${run}@example.com`, "Ada");
  const staff = await createConfirmedUser(`gp-e2e-staff-${run}@example.com`, "Sam");
  const { error } = await admin().from("staff_roles").insert({ user_id: staff.id, role: "admin" });
  if (error) throw error;
  saveAccounts({ student, staff, signup: { email: `gp-e2e-signup-${run}@example.com` } });
}
