import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only Supabase client.
 * Uses anon key by default. If SUPABASE_SERVICE_ROLE_KEY is set, it can be used
 * for trusted server-side operations (e.g. inserting leads from API route).
 * Returns null if env is incomplete.
 */
export function getSupabaseServerClient(opts: { useServiceRole?: boolean } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = opts.useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
