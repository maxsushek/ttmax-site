import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser-side Supabase client.
 * Returns null if env vars are missing, so callers can no-op gracefully.
 */
export function getSupabaseBrowserClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  cached = createBrowserClient<Database>(url, anon);
  return cached;
}
