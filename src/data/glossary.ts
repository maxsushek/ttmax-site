// src/data/glossary.ts
// Словник настільного тенісу /{locale}/slovnyk — терміни з короткими визначеннями.
//
// ⚠️ НАВІЩО ОКРЕМА СТОРІНКА, А НЕ СТАТТЯ: ШІ-асистенти найчастіше відповідають на «що таке X»
// і цитують короткі точні визначення дослівно. Тут кожен термін має свій якір (#slug) і
// DefinedTerm у розмітці, тож на нього можна посилатися з будь-якої статті чи картки.
//
// Дані — з перевірених JSON (scripts/gen-glossary.mjs <тека>) → glossaryData.ts. Числа правил —
// лише з ITTF Laws; техніка Butterfly — з офіційних сторінок і нашого каталогу. Нічого «від себе».
import type { Locale } from "@/i18n/config";
import { GLOSSARY_DATA } from "@/data/glossaryData";

type L = Record<Locale, string>;

export type GlossaryCategory = "blades" | "rubbers" | "technique" | "rules" | "play";

export type GlossaryTerm = {
  slug: string;
  cat: GlossaryCategory;
  term: L;
  aka: Record<Locale, string[]>;
  def: L;
  /** Наша сторінка, що пояснює термін докладно (шлях без локалі) або null. */
  href: string | null;
  sources: string[];
};

/** Порядок і назви розділів сторінки. */
export const GLOSSARY_CATEGORIES: { key: GlossaryCategory; title: L }[] = [
  { key: "rules", title: { ua: "Правила й рахунок", ru: "Правила и счёт" } },
  { key: "technique", title: { ua: "Техніка й удари", ru: "Техника и удары" } },
  { key: "play", title: { ua: "Обертання, стилі гри й тренування", ru: "Вращение, стили игры и тренировки" } },
  { key: "rubbers", title: { ua: "Накладки", ru: "Накладки" } },
  { key: "blades", title: { ua: "Основи", ru: "Основания" } },
];

/** Дата останньої звірки словника з джерелами (видимо «Оновлено» + lastmod у sitemap). */
export const GLOSSARY_CHECKED = "2026-11-16";

export const GLOSSARY: GlossaryTerm[] = GLOSSARY_DATA;

/** Терміни категорії за абеткою мови сторінки. */
export function glossaryByCategory(cat: GlossaryCategory, locale: Locale): GlossaryTerm[] {
  const collator = new Intl.Collator(locale === "ua" ? "uk" : "ru");
  return GLOSSARY.filter((t) => t.cat === cat).sort((a, b) => collator.compare(a.term[locale], b.term[locale]));
}
