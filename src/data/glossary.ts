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
  /**
   * Словоформи для автопосилань у статтях і картках (lib/glossary/autolink.tsx). Є лише в
   * термінів, які безпечно лінкувати: специфічна лексика, не побутові слова («очко», «гра»).
   */
  forms?: { ua: string[]; ru: string[]; caseSensitive?: boolean };
  /**
   * Окрема сторінка терміна /slovnyk/<slug>.
   *
   * ⚠️ ЛИШЕ для термінів БЕЗ власної статті чи хабу: ALC/ZLC, топспін, тензор, OX уже мають
   * статті, і окрема сторінка терміна билася б із ними за той самий запит («alc это» веде на
   * статтю alc-chy-zlc). Такі терміни лишаються якорями зі посиланням на статтю.
   */
  page?: GlossaryPage;
};

export type GlossaryPage = {
  metaTitle: L;
  metaDescription: L;
  h1: L;
  body: Record<Locale, string[]>;
  facts: { columns: L[]; rows: (L & { href?: string })[][] } | null;
  faq: { q: L; a: L }[];
  related: string[];
  links: { label: L; href: string }[];
  sources: { label: L; url: string }[];
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

export function getGlossaryTerm(slug: string): GlossaryTerm | null {
  return GLOSSARY.find((t) => t.slug === slug) ?? null;
}

/** Терміни з окремою сторінкою. */
export function glossaryPages(): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.page);
}

/** Куди веде посилання на термін: окрема сторінка, якщо є, інакше якір у словнику. */
export function glossaryTermPath(t: GlossaryTerm): string {
  return t.page ? `/slovnyk/${t.slug}` : `/slovnyk#${t.slug}`;
}
