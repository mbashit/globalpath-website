import { admin, loadAccounts } from "./accounts";

/** Deletes every gp-e2e-* account (profiles and roles cascade). */
export default async function globalTeardown() {
  const a = loadAccounts();
  const db = admin();
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emails = new Set([a.student.email, a.staff.email, a.signup.email]);
  for (const user of data?.users ?? []) {
    if (user.email && (emails.has(user.email) || /^gp-e2e-[a-z]+-[a-z0-9]+@example\.com$/.test(user.email))) {
      await db.auth.admin.deleteUser(user.id);
    }
  }
}
