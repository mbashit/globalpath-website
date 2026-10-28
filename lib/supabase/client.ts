"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./config";

let browserClient: SupabaseClient | null = null;

/** Browser client – only used for MFA enrolment and detecting a session in the header. */
export function createClient(): SupabaseClient {
  browserClient ??= createBrowserClient(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
