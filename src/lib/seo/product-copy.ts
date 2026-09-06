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
import { META_CAP, META_MIN, clauseCut, sentences } from "@/lib/seo/meta-length";

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

/**
 * Чи починається вердикт із назви моделі — тоді лід не додаємо.
 *
 * ⚠️ Інакше виходило «Butterfly Omar Assar — Omar Assar — рідкісний…»: половину
 * сніпета займало подвоєне ім'я моделі. Порівнюємо по МОДЕЛІ, а не по повній назві:
 * у name є бренд («Butterfly Omar Assar»), а вердикт починається без нього.
 */
function startsWithModel(verdict: string, product: CatalogProduct): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s.\-–—]+/g, "");
  const head = norm(verdict.slice(0, product.model.length + 4));
  return head.startsWith(norm(product.model));
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

  const tail = hasLivePrice(product) ? TAIL.priced[locale] : TAIL.onRequest[locale];
  const lead = startsWithModel(verdict, product) ? "" : `${product.name[locale]} — `;

  /**
   * ⚠️ ДОБИРАЄМО РЕЧЕННЯ, доки влазять, а не беремо лише перше.
   *
   * Стара версія зупинялась на першому реченні вердикту, і там, де воно коротке,
   * опис виходив на 86 символів при доступних 158 — тобто нижче порога 110, за яким
   * Google дописує сніпет сам, з випадкового місця сторінки. Наприклад Dignics 64:
   * «Найшвидша накладка лінійки Dignics.» — 35 символів, а друге речення з поясненням
   * про шипи й темп просто губилось.
   */
  const parts = sentences(verdict);
  let body = parts[0] ?? verdict;
  let used = 1;
  for (const next of parts.slice(1)) {
    if (lead.length + body.length + 1 + next.length + 1 + tail.length > META_CAP) break;
    body = `${body} ${next}`;
    used += 1;
  }

  const withTail = `${lead}${body} ${tail}`;
  if (withTail.length >= META_MIN && withTail.length <= META_CAP) return withTail;

  /**
   * ⚠️ Не дотягнули до мінімуму — добираємо ЧАСТИНОЮ наступного речення замість хвоста.
   *
   * Хвіст «Ціна й доставка по Україні» коштує 27 символів і не несе змісту, тож коли
   * ціле наступне речення не влазить разом із ним, вигідніше віддати місце тексту.
   * Приклад — Dignics 64: перше речення 35 символів, друге 111, разом із хвостом 197.
   * Без цієї гілки опис лишався б на 86 символах, а Google дописував би сніпет сам.
   */
  const rest = parts[used];
  if (withTail.length < META_MIN && rest) {
    const room = META_CAP - lead.length - body.length - 1;
    if (room > 40) {
      const extended = `${lead}${body} ${clauseCut(rest, room)}`;
      if (extended.length > withTail.length) return extended;
    }
  }

  if (withTail.length <= META_CAP) return withTail;
  if (lead.length + body.length <= META_CAP) return `${lead}${body}`;
  return `${lead}${clauseCut(body, META_CAP - lead.length)}`;
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
