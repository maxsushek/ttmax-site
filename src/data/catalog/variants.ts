// src/data/catalog/variants.ts
// Варіанти моделі, які в прайсі заведені ОКРЕМИМИ товарами: інший колір кросівок, інший
// обʼєм клею. Модель та сама — тож і опис той самий, що в основної картки.
//
// ЯК ПРАЦЮЄ:
//  • сторінка варіанта показує експертний блок основної моделі (опис, FAQ, порівняння,
//    «Дивіться також») і плашку «це варіант моделі X» з посиланням на основну картку;
//  • canonical варіанта веде на основну картку, а в sitemap варіант не подається
//    (productIndexable → false). Так покупець бачить повний опис, а Google не отримує
//    дубль тексту на кількох URL.
//
// ⚠️ Додавати сюди лише справжні варіанти тієї самої моделі. «Freechack PRO 37ml» — це
// попередня модель Pro, а не Pro II, тому її тут НЕМАЄ (власного опису в неї поки немає).
import type { Localized } from "@/types/catalog";
import type { ExpertEntry } from "./expert";
import { getExpert } from "./expert";

export type VariantLink = {
  /** slug основної картки моделі (з експертним блоком). */
  main: string;
  kind: "color" | "volume";
  /** Чим відрізняється: «сині», «37 мл». */
  label: Localized;
};

const color = (main: string, ua: string, ru: string): VariantLink => ({ main, kind: "color", label: { ua, ru } });
const volume = (main: string, ml: number): VariantLink => ({
  main,
  kind: "volume",
  label: { ua: `${ml} мл`, ru: `${ml} мл` },
});

const RIFONES = "krosivky-butterfly-lezoline-rifones";
const GROOVY = "krosivky-butterfly-lezoline-groovy-rozhevi";
const FREE_CHACK = "klei-butterfly-free-chack-90-ml";
const PRO_II = "klei-butterfly-freechack-pro-ii-90ml";

export const VARIANTS: Record<string, VariantLink> = {
  "krosivky-butterfly-lezoline-rifones-syni": color(RIFONES, "сині", "синие"),
  "krosivky-butterfly-lezoline-rifones-chorni": color(RIFONES, "чорні", "чёрные"),
  "krosivky-butterfly-lezoline-groovy-syni-44r": color(GROOVY, "сині", "синие"),
  "krosivky-butterfly-lezoline-groovy-chorni": color(GROOVY, "чорні", "чёрные"),
  "klei-butterfly-free-chack-37-ml": volume(FREE_CHACK, 37),
  "klei-butterfly-free-chack-50ml": volume(FREE_CHACK, 50),
  "klei-butterfly-free-chack-500-ml": volume(FREE_CHACK, 500),
  "klei-butterfly-freechack-pro-ii-50ml": volume(PRO_II, 50),
  "klei-butterfly-freechack-pro-ii-500ml": volume(PRO_II, 500),
};

export const variantOf = (slug: string): VariantLink | undefined => VARIANTS[slug];

/** Експертний блок картки: власний або (для варіанта) основної моделі. */
export function expertFor(slug: string): ExpertEntry | undefined {
  const own = getExpert(slug);
  if (own) return own;
  const v = VARIANTS[slug];
  return v ? getExpert(v.main) : undefined;
}
