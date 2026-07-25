// src/lib/seo/product-copy.ts
// SEO-копірайт картки товару з ЕКСПЕРТНОГО контенту (expert.ts), а не з шаблону.
//
// Навіщо: рендерер метаданих раніше отримував лише {name, category, price}, тому на 620 із 622
// карток був ОДИН шаблон — «Купити Butterfly {N} в Україні. Характеристики, ціна, відгуки…» —
// і він же їхав в og:description, twitter:description і Product.description. При цьому 127/127
// money-карток мають унікальний «Короткий вердикт» (verdict), який нікуди не доходив.
// Текст був унікальний на 100%, а вітрина в SERP — на 0%.
//
// Три РІЗНІ поля (навмисно, не один рядок на всіх):
//   meta description   — назва + перше речення вердикту (+ хвіст, якщо влазить), cap 158
//   og:description     — ПОВНИЙ вердикт без обрізки (соцмережі не ріжуть на 158)
//   Product.description — вердикт + офіційні характеристики Butterfly (найдовший, для schema)
//
// ⚠️ Хвіст умовний по ціні: 4 картки не мають ціни (roundell, roundell-soft, bugller, feint-ox).
// Хардкод «Ціна … , є в наявності» дав би на них порожню ціну й брехню про наявність.
//
// ⚠️ ПОРЯДОК ПРІОРИТЕТІВ у meta (перевірено прогоном по всіх 86 money-описах):
//   назва моделі > цілісність думки > хвіст.
// Назву не викидаємо НІКОЛИ (вона дає збіг із бренд-запитом у сніпеті), хвіст — за потреби.
// Наївна «обрізка по межі речення» давала «…» у 62 з 86 описів, бо майже кожен вердикт —
// це одне довге речення; тому ріжемо по межі КЛАУЗИ (— : ; ,), і лише в крайньому разі по слову.
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import { getExpert } from "@/data/catalog/expert";
import { getMinPrice } from "@/data/catalog";

/** Google ріже сніпет ~160 символів. Тримаємо невеликий запас. */
const META_CAP = 158;

const TAIL = {
  priced: {
    ua: "Ціна й доставка по Україні.",
    ru: "Цена и доставка по Украине.",
  },
  onRequest: {
    ua: "Характеристики й доставка.",
    ru: "Характеристики и доставка.",
  },
} satisfies Record<string, Record<Locale, string>>;

/** Перше речення тексту (до крапки/!/?), або весь текст, якщо розділового немає. */
function firstSentence(text: string): string {
  const m = /^\s*([^.!?]+[.!?])/.exec(text.trim());
  return (m?.[1] ?? text).trim();
}

/**
 * Обрізка по межі КЛАУЗИ (— : ; ,) — читається як завершена думка.
 * Якщо жодної межі в межах ліміту немає — ріжемо по слову з «…».
 */
function clauseCut(text: string, cap: number): string {
  if (text.length <= cap) return text;
  let best = -1;
  for (const m of text.matchAll(/[—:;,]\s/g)) {
    if (m.index === undefined) continue;
    if (m.index <= cap - 1) best = m.index;
    else break;
  }
  if (best > cap * 0.45) return `${text.slice(0, best).trimEnd()}.`;
  const hard = text.slice(0, cap - 1);
  const lastSpace = hard.lastIndexOf(" ");
  const base = lastSpace > cap * 0.5 ? hard.slice(0, lastSpace) : hard;
  return `${base.replace(/[\s,;:—-]+$/, "")}…`;
}

/** Чи має товар живу ціну (обирає хвіст: «ціна й доставка» vs «характеристики»). */
function hasLivePrice(product: CatalogProduct): boolean {
  const p = getMinPrice(product);
  return typeof p === "number" && p > 0;
}

function verdictOf(product: CatalogProduct, locale: Locale): string | null {
  const v = getExpert(product.slug)?.verdict?.[locale]?.trim();
  return v ? v : null;
}

/**
 * meta description. null → викликач лишає свій фолбек
 * (картки без експертного контенту, напр. хвіст gear).
 */
export function productMetaDescription(product: CatalogProduct, locale: Locale): string | null {
  const verdict = verdictOf(product, locale);
  if (!verdict) return null;

  const name = product.name[locale];
  const sentence = firstSentence(verdict);
  const tail = hasLivePrice(product) ? TAIL.priced[locale] : TAIL.onRequest[locale];
  const lead = `${name} — `;

  if (lead.length + sentence.length + 1 + tail.length <= META_CAP)
    return `${lead}${sentence} ${tail}`;
  if (lead.length + sentence.length <= META_CAP) return `${lead}${sentence}`;
  return `${lead}${clauseCut(sentence, META_CAP - lead.length)}`;
}

/** og:description / twitter — ПОВНИЙ вердикт (соцмережі не ріжуть на 158). */
export function productOgDescription(product: CatalogProduct, locale: Locale): string | null {
  const verdict = verdictOf(product, locale);
  if (!verdict) return null;
  return `${product.name[locale]} — ${verdict}`;
}

/** Product JSON-LD description — вердикт + офіційні характеристики Butterfly. */
export function productLdDescription(product: CatalogProduct, locale: Locale): string | null {
  const verdict = verdictOf(product, locale);
  if (!verdict) return null;
  const official = getExpert(product.slug)?.official?.[locale]?.trim();
  return official ? `${verdict} ${official}` : verdict;
}
