// src/lib/glossary/autolink.tsx
// Автопосилання на словник: ПЕРША згадка терміна в тексті сторінки стає посиланням на його
// визначення (/slovnyk#slug або окрема сторінка терміна).
//
// ⚠️ НАВІЩО ТАК ОБЕРЕЖНО:
//  • лінкуються лише терміни з полем `forms` (перевірений список словоформ) — побутові слова
//    («очко», «гра», «блок») туди не входять, інакше текст перетворився б на суцільні лінки;
//  • один термін — одне посилання на сторінку, і не більше `max` посилань загалом;
//  • термін не лінкується на сторінці, яка сама його пояснює (`skipHrefs`): у статті
//    «ALC чи ZLC» слово ALC не веде в словник, бо словник веде назад у цю статтю;
//  • збіг — лише ціле слово (межі за літерами, цифрами й апострофами), найдовша форма першою:
//    «Super ALC» не розпадається на «Super» + лінк «ALC»;
//  • термін НЕ лінкується всередині назви моделі («Timo Boll ALC», «Gionis Carbon DEF») і
//    всередині захисних фраз зі словника («чоп-блок» ≠ «чоп», «Гранд Смеш» ≠ «смеш»): назва
//    товару — це не згадка терміна, а лінк усередині неї ще й ламає вигляд назви;
//  • два лінки не стають упритул через дефіс («outer-ALC» → лінк лише на перше слово).
// Один лінкер створюється на рендер сторінки й викликається для абзаців ПО ЧЕРЗІ — так
// «перша згадка» рахується на всю сторінку, а не на кожен абзац.
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { GLOSSARY, glossaryTermPath, type GlossaryTerm } from "@/data/glossary";
import { GLOSSARY_GUARDS } from "@/data/glossaryData";
import { catalogBases, catalogProducts } from "@/data/catalog";

type Entry = { term: GlossaryTerm; form: string; caseSensitive: boolean };

const WORD = /[\p{L}\p{N}'ʼ’]/u;

function entriesFor(locale: Locale): Entry[] {
  const out: Entry[] = [];
  for (const term of GLOSSARY) {
    if (!term.forms) continue;
    for (const form of term.forms[locale] ?? []) {
      if (form.trim().length < 2) continue;
      out.push({ term, form, caseSensitive: term.forms.caseSensitive ?? false });
    }
  }
  // Найдовші форми першими: «Super ALC» раніше за «ALC».
  return out.sort((a, b) => b.form.length - a.form.length);
}

const cache = new Map<Locale, Entry[]>();

/** Назви моделей (2+ слова) + захисні фрази: збіг усередині такого фрагмента відкидаємо. */
const guardCache = new Map<Locale, string[]>();
function guardsFor(locale: Locale): string[] {
  let g = guardCache.get(locale);
  if (!g) {
    const models = [...catalogProducts, ...catalogBases].map((p) => p.model).filter((m) => m.includes(" "));
    g = [...new Set([...models, ...GLOSSARY_GUARDS[locale]])].sort((a, b) => b.length - a.length);
    guardCache.set(locale, g);
  }
  return g;
}

/** Проміжки тексту, зайняті назвами моделей і захисними фразами. */
function guardSpans(text: string, guards: string[]): [number, number][] {
  const spans: [number, number][] = [];
  for (const g of guards) {
    let at = text.indexOf(g);
    while (at !== -1) {
      spans.push([at, at + g.length]);
      at = text.indexOf(g, at + g.length);
    }
  }
  return spans;
}

export type GlossaryLinker = (text: string, keyPrefix?: string) => ReactNode;

export function createGlossaryLinker(
  locale: Locale,
  opts: {
    skipHrefs?: string[];
    skipSlugs?: string[];
    max?: number;
    /**
     * Заголовок сторінки: терміни, названі в ньому, не лінкуємо — сторінка сама є головним
     * матеріалом про них (у статті «ALC чи ZLC» слова ALC і ZLC у словник не ведуть).
     */
    skipIfIn?: string[];
  } = {},
): GlossaryLinker {
  let entries = cache.get(locale);
  if (!entries) {
    entries = entriesFor(locale);
    cache.set(locale, entries);
  }
  const skipHrefs = new Set(opts.skipHrefs ?? []);
  const used = new Set<string>(opts.skipSlugs ?? []);
  const max = opts.max ?? 8;
  let made = 0;
  const all = entries;
  for (const title of opts.skipIfIn ?? []) {
    const lowerTitle = title.toLowerCase();
    for (const e of all) {
      if (used.has(e.term.slug)) continue;
      const hay = e.caseSensitive ? title : lowerTitle;
      const needle = e.caseSensitive ? e.form : e.form.toLowerCase();
      let at = hay.indexOf(needle);
      while (at !== -1) {
        const before = at > 0 ? title[at - 1]! : "";
        const after = title[at + needle.length] ?? "";
        if (!(before && WORD.test(before)) && !(after && WORD.test(after))) {
          used.add(e.term.slug);
          break;
        }
        at = hay.indexOf(needle, at + 1);
      }
    }
  }

  return function link(text: string, keyPrefix = "g"): ReactNode {
    if (made >= max || all.length === 0 || !text) return text;
    const lower = text.toLowerCase();
    const spans = guardSpans(text, guardsFor(locale));
    const guarded = (from: number, to: number) => spans.some(([a, b]) => from < b && to > a);
    let lastLinkEnd = -2;
    // Знаходимо найраніший збіг серед ще не використаних термінів; повторюємо для решти тексту.
    const parts: ReactNode[] = [];
    let pos = 0;
    while (made < max) {
      let best: { at: number; entry: Entry } | null = null;
      for (const e of all) {
        if (used.has(e.term.slug)) continue;
        if (e.term.href && skipHrefs.has(e.term.href)) continue;
        const hay = e.caseSensitive ? text : lower;
        const needle = e.caseSensitive ? e.form : e.form.toLowerCase();
        let at = hay.indexOf(needle, pos);
        while (at !== -1) {
          const before = at > 0 ? text[at - 1]! : "";
          const after = text[at + needle.length] ?? "";
          const wholeWord = !(before && WORD.test(before)) && !(after && WORD.test(after));
          const glued = before === "-" && at - 1 === lastLinkEnd;
          if (wholeWord && !glued && !guarded(at, at + needle.length)) break;
          at = hay.indexOf(needle, at + 1);
        }
        if (at === -1) continue;
        // Раніший збіг виграє; за однакової позиції — довша форма (список уже відсортований).
        if (!best || at < best.at) best = { at, entry: e };
      }
      if (!best) break;
      const { at, entry } = best;
      const end = at + entry.form.length;
      if (at > pos) parts.push(text.slice(pos, at));
      parts.push(
        <Link
          key={`${keyPrefix}-${entry.term.slug}`}
          href={`/${locale}${glossaryTermPath(entry.term)}`}
          prefetch={false}
          data-glossary={entry.term.slug}
          title={entry.term.def[locale]}
          className="underline decoration-dotted decoration-ink-dim underline-offset-4 hover:text-ink hover:decoration-accent"
        >
          {text.slice(at, end)}
        </Link>,
      );
      used.add(entry.term.slug);
      made++;
      pos = end;
      lastLinkEnd = end;
    }
    if (parts.length === 0) return text;
    if (pos < text.length) parts.push(text.slice(pos));
    return parts;
  };
}
