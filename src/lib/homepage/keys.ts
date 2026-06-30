// src/lib/homepage/keys.ts
// Чисті константи головної (без серверних імпортів) — безпечно імпортувати в client-компонентах.

/** Базові імена редагованих текстів головної. Ключ у БД = home_<base>_<uk|ru>. */
export const HOME_TEXT_BASES = [
  "hero_badge",
  "hero_title",
  "hero_subtitle",
  "cat_kicker",
  "cat_title_muted",
  "cat_title_accent",
  "prod_kicker",
  "prod_title_muted",
  "prod_title_accent",
  "brands_kicker",
  "brands_title",
  "trust_1",
  "trust_2",
  "trust_3",
  "trust_4",
  "cta_kicker",
  "cta_title",
  "cta_subtitle",
  "faq_kicker",
  "faq_title",
] as const;

export type HomeTextBase = (typeof HOME_TEXT_BASES)[number];

/** Ключ налаштування для тексту: home_<base>_<lang>. */
export const homeKey = (base: string, lang: "uk" | "ru"): string => `home_${base}_${lang}`;

/** Усі текстові ключі (uk+ru) — для whitelist та завантаження у редактор. */
export const HOME_TEXT_KEYS: string[] = HOME_TEXT_BASES.flatMap((b) => [
  homeKey(b, "uk"),
  homeKey(b, "ru"),
]);

/** Зворотна сумісність (Hero/Brands/Products) + ключ списку хітів. */
export const HOME_KEYS = {
  heroTitleUk: "home_hero_title_uk",
  heroTitleRu: "home_hero_title_ru",
  brandsTitleUk: "home_brands_title_uk",
  brandsTitleRu: "home_brands_title_ru",
  hits: "home_hits",
} as const;

/** Усі ключі головної — для whitelist у API настройок. */
export const HOME_KEY_VALUES: string[] = [...HOME_TEXT_KEYS, HOME_KEYS.hits];

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
