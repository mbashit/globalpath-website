/** Password rules shared by the sign-up/reset forms and the server actions. */
export const PASSWORD_MIN = 10;

export function passwordIssues(password: string, email = ""): string[] {
  const issues: string[] = [];
  if (password.length < PASSWORD_MIN) issues.push(`at least ${PASSWORD_MIN} characters`);
  if (password.length > 72) issues.push("no more than 72 characters");
  if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("a number");
  const local = email.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) issues.push("not contain your email name");
  return issues;
}

/** 0–4 for the strength meter. */
export function passwordScore(password: string): number {
  let score = 0;
  if (password.length >= PASSWORD_MIN) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(next: unknown, fallback = "/portal"): string {
  // URL parsers drop tabs/newlines and treat "\" as "/", so "/\t/evil.com" would become "//evil.com".
  if (typeof next !== "string" || next.length > 500 || !next.startsWith("/") || /[\x00-\x1f\x7f\\]/.test(next)) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

/** Read a trimmed string from FormData, capped to a maximum length. */
export function str(form: FormData, name: string, max = 500): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function optional(form: FormData, name: string, max = 500): string | null {
  return str(form, name, max) || null;
}

export function isoDate(form: FormData, name: string): string | null {
  const v = str(form, name, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Turn a Postgres/PostgREST error into a message safe to show the user. */
export function friendlyDbError(error: { message?: string; code?: string } | null | undefined, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  // Messages raised deliberately by our SQL functions use these codes and are written for users.
  if ((error.code === "22023" || error.code === "42501") && error.message && error.message.length < 200) return error.message;
  if (error.code === "23505") return "That entry already exists.";
  if (error.code === "23514") return "Some values are not in the expected format.";
  return fallback;
}
