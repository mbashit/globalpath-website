import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export const STATE_FILE = "test-results/e2e-accounts.json";
export const PASSWORD = "Gp-e2e-Passw0rd-2026";

export type TestAccounts = { student: { id: string; email: string }; staff: { id: string; email: string }; signup: { email: string } };

export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for e2e tests");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function createConfirmedUser(email: string, firstName: string) {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: "E2E", accepted_terms: "true" },
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  return { id: data.user.id, email };
}

export const saveAccounts = (a: TestAccounts) => writeFileSync(STATE_FILE, JSON.stringify(a));
export const loadAccounts = (): TestAccounts => JSON.parse(readFileSync(STATE_FILE, "utf8"));
