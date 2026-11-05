import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-memory throttle for auth actions, layered on top of
 * Supabase Auth's own server-side rate limits. Serverless instances do not
 * share memory, so this slows down casual abuse only.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimited(action: string, limit: number, windowMs: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${action}:${ip.slice(0, 64)}`;
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  const entry = buckets.get(key);
  if (!entry) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
