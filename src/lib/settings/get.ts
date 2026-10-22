// src/lib/settings/get.ts
// Єдиний кешований источник налаштувань сайту (таблиця site_settings).
// Читає всі рядки одним запитом і віддає map "key" → value (jsonb).
// Кеш інвалідуэться тегом SETTINGS_TAG при збереженні в адмінці (без передеплою).
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { noClient, queryFailed } from "@/lib/supabase/load-failure";
import { buildMemo } from "@/lib/supabase/build-memo";

export const SETTINGS_TAG = "site-settings";

export type SettingsMap = Record<string, unknown>;

async function loadAll(): Promise<SettingsMap> {
  // service role: site_settings закрита RLS, читаємо лише на сервері
  const client = getSupabaseServerClient({ useServiceRole: true });
  // Збій — виняток, не {}: порожня карта лягла б у кеш без таймера (supabase/load-failure.ts).
  if (!client) return noClient("settings", {});
  const db = client as unknown as SupabaseClient;

  const { data, error } = await db.from("site_settings").select("key, value");
  if (error || !data) queryFailed("settings", error?.message ?? "порожня відповідь");

  const map: SettingsMap = {};
  for (const row of data as { key: string; value: unknown }[]) {
    map[row.key] = row.value;
  }
  return map;
}

/** Кешована карта всіх налаштувань. Безпечно викликати в будь-якому серверному компоненті. */
// v2: без таймера (revalidate: false — див. [...segments]/page.tsx). Зміни — лише через
// адмінку (revalidateTag); SQL-правка site_settings повз адмінку = бамп версії + деплой.
// Мемо — всередині unstable_cache: тег SETTINGS_TAG лягає на кожну сторінку, запит під час
// збірки — один на процес (lib/supabase/build-memo.ts).
export const getSettings = unstable_cache(() => buildMemo("settings", loadAll), ["site-settings-map-v2"], {
  tags: [SETTINGS_TAG],
  revalidate: false,
});

/** Значення-рядок за ключем або "" (порожнє трактуэться як «не задано»). */
export function settingString(map: SettingsMap, key: string): string {
  const v = map[key];
  return typeof v === "string" ? v : "";
}
