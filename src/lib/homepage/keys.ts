// src/lib/homepage/keys.ts
// Чисті константи головної (без серверних імпортів) — безпечно імпортувати в client-компонентах.

export const HOME_KEYS = {
  heroTitleUk: "home_hero_title_uk",
  heroTitleRu: "home_hero_title_ru",
  brandsTitleUk: "home_brands_title_uk",
  brandsTitleRu: "home_brands_title_ru",
  hits: "home_hits",
} as const;

/** Усі ключі головної — для whitelist в API настройок. */
export const HOME_KEY_VALUES: string[] = Object.values(HOME_KEYS);

/** Початковий набір хітів (поки адмін не задав свій). */
export const DEFAULT_HITS: string[] = [
  "tenergy-05",
  "viscaria",
  "dignics-05",
  "timo-boll-alc",
  "dignics-09c",
  "apolonia-zlc",
  "zyre-03",
  "harimoto-tomokazu-alc",
];

/** Парсить рядок "slug1, slug2" у масив slug. */
export function parseHits(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
