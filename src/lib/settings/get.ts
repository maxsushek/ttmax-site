// src/lib/settings/get.ts
// Єдиний кешований источник налаштувань сайту (таблиця site_settings).
// Читає всі рядки одним запитом і віддає map "key" → value (jsonb).
// Кеш інвалідуэться тегом SETTINGS_TAG при збереженні в адмінці (без передеплою).
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SETTINGS_TAG = "site-settings";

export type SettingsMap = Record<string, unknown>;

async function loadAll(): Promise<SettingsMap> {
  // service role: site_settings закрита RLS, читаємо лише на сервері
  const client = getSupabaseServerClient({ useServiceRole: true });
  if (!client) return {};
  const db = client as unknown as SupabaseClient;

  const { data, error } = await db.from("site_settings").select("key, value");
  if (error || !data) return {};

  const map: SettingsMap = {};
  for (const row of data as { key: string; value: unknown }[]) {
    map[row.key] = row.value;
  }
  return map;
}

/** Кешована карта всіх налаштувань. Безпечно викликати в будь-якому серверному компоненті. */
export const getSettings = unstable_cache(loadAll, ["site-settings-map-v1"], {
  tags: [SETTINGS_TAG],
  revalidate: 3600,
});

/** Значення-рядок за ключем або "" (порожнє трактуэться як «не задано»). */
export function settingString(map: SettingsMap, key: string): string {
  const v = map[key];
  return typeof v === "string" ? v : "";
}
