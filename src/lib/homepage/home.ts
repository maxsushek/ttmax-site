// src/lib/homepage/home.ts
// Серверні хелпери головної (читають site_settings). Константи — у ./keys (client-safe).
import type { SettingsMap } from "@/lib/settings/get";
import { settingString } from "@/lib/settings/get";
import { HOME_KEYS, DEFAULT_HITS, parseHits } from "./keys";

export { HOME_KEYS, HOME_KEY_VALUES, DEFAULT_HITS, parseHits } from "./keys";

/** Поточні slug хітів: налаштування або дефолтний сид. */
export function resolveHitSlugs(settings: SettingsMap): string[] {
  const list = parseHits(settingString(settings, HOME_KEYS.hits));
  return list.length > 0 ? list : DEFAULT_HITS;
}

/** Заголовок Hero (accent-рядок) з оверрайду або "". */
export function heroTitleOverride(settings: SettingsMap, locale: "uk" | "ru"): string {
  return settingString(settings, locale === "ru" ? HOME_KEYS.heroTitleRu : HOME_KEYS.heroTitleUk);
}

/** Заголовок секції брендів з оверрайду або "". */
export function brandsTitleOverride(settings: SettingsMap, locale: "uk" | "ru"): string {
  return settingString(
    settings,
    locale === "ru" ? HOME_KEYS.brandsTitleRu : HOME_KEYS.brandsTitleUk,
  );
}
