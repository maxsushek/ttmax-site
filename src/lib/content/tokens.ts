// src/lib/content/tokens.ts
// Серверний рушій токенів для контенту/мета: підставляє ЖИВІ значення (ціна з оверрайдами,
// кількість моделей, рік) на рендері. Нічого не зберігає — тому будь-яка зміна ціни в адмінці
// (інвалідація PRODUCT_OVERRIDES_TAG) одразу відображається без ручного редагування текстів.
//
// Синтаксис: {{token}} або {{token:arg}}
//   {{price_from}}                 — мін. ціна поточної сутності (серія/категорія/бренд), з оверрайдами
//   {{price_from:tenergy}}         — мін. ціна іншої серії/категорії/бренду за slug
//   {{price:dignics-05}}           — ціна конкретного товару за slug
//   {{count}} / {{count:tenergy}}  — кількість моделей у поточній / іншій сутності
//   {{year}}                       — поточний рік
// formatPrice уже дописує «грн» — у тексті пишемо "від {{price_from}}" (без ручної валюти).
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import { formatPrice } from "@/utils/format";
import {
  catalogCategories,
  catalogSeries,
  getMinPrice,
  getProductBySlug,
  getProductsByBrand,
  getProductsByCategory,
  getProductsBySeries,
} from "@/data/catalog";
import { applyOverrides, type OverridesMap } from "@/lib/catalog/overrides";
import type { ContentBlock } from "@/lib/content/get";

export type TokenContext = {
  locale: Locale;
  year: number;
  overrides: OverridesMap;
  /** Поточна сутність маршруту — рахується з її ж товарів (оверрайди враховані). */
  current: { minPrice: number | null; count: number };
};

function minPriceOf(products: CatalogProduct[], ov: OverridesMap): number | null {
  let min: number | null = null;
  for (const p of products) {
    const m = getMinPrice(applyOverrides(p, ov));
    if (typeof m === "number" && m > 0 && (min === null || m < min)) min = m;
  }
  return min;
}

/** Резолвить slug у набір товарів: серія → категорія → бренд. */
function productsForSlug(slug: string): CatalogProduct[] {
  if (catalogSeries.some((s) => s.slug === slug)) return getProductsBySeries(slug);
  if (catalogCategories.some((c) => c.slug === slug)) return getProductsByCategory(slug);
  return getProductsByBrand(slug);
}

export function buildTokenContext(params: {
  locale: Locale;
  overrides: OverridesMap;
  /** Товари поточної сутності (raw — оверрайди накладаються всередині). */
  currentProducts: CatalogProduct[];
}): TokenContext {
  const { locale, overrides, currentProducts } = params;
  return {
    locale,
    overrides,
    year: new Date().getFullYear(),
    current: {
      minPrice: minPriceOf(currentProducts, overrides),
      count: currentProducts.length,
    },
  };
}

const TOKEN_RE = /\{\{\s*([a-z_]+)(?::([a-z0-9-]+))?\s*\}\}/gi;

/**
 * ⚠️ Ціни може НЕ БУТИ — і тоді фразу треба прибрати цілком, а не лишати огризок.
 *
 * {{price_from}} у шаблонах майже завжди стоїть після прийменника: «моделей від
 * {{price_from}}», «Одяг Butterfly - від {{price_from}}». Коли ціни немає (уся
 * категорія «Ціна за запитом»), токен розкривався в порожній рядок і на сторінку
 * їхало «47 моделей від .» та «Одяг Butterfly - .» — з висячим прийменником і тире.
 *
 * Тому спершу прибираємо ВСЮ фразу разом із прийменником і роздільником перед ним,
 * і лише потім розкриваємо решту токенів. Якщо ціна є — нічого не чіпаємо.
 */
// ⚠️ БЕЗ \b перед «від»: у JavaScript \b рахується по \w = [A-Za-z0-9_], тож перед
// кирилицею межі слова НЕМАЄ і шаблон просто не спрацьовує (перевірено — фраза
// лишалась на місці). Тому явно перелічуємо, що може стояти перед прийменником:
// початок рядка, тире-роздільник або пробіл.
const PRICE_PHRASE_RE =
  /(?:^|\s*[-–—]\s*|\s+)(?:від|от)\s+\{\{\s*price_from(?::([a-z0-9-]+))?\s*\}\}/gi;

export function expandTokens(text: string | undefined, ctx: TokenContext): string | undefined {
  if (!text) return text;
  let removedPrice = false;
  let withPrice = text.replace(PRICE_PHRASE_RE, (whole, arg: string | undefined) => {
    const v = arg ? minPriceOf(productsForSlug(arg), ctx.overrides) : ctx.current.minPrice;
    if (v != null) return whole;
    removedPrice = true;
    return "";
  });
  // Прибирання фрази лишає осиротілу пунктуацію: «Від {{price_from}}. Ціна залежить…»
  // перетворилось би на «. Ціна залежить…». Чистимо ЛИШЕ там, де щось справді
  // вирізали, щоб не чіпати звичайні тексти.
  if (removedPrice) {
    withPrice = withPrice
      .replace(/\s+([.,;:!?])/g, "$1")
      .replace(/^[\s.,;:—–-]+/, "")
      .replace(/ {2,}/g, " ")
      .trim();
  }
  return withPrice.replace(TOKEN_RE, (whole, nameRaw: string, arg: string | undefined) => {
    switch (nameRaw.toLowerCase()) {
      case "year":
        return String(ctx.year);
      case "count":
        return String(arg ? productsForSlug(arg).length : ctx.current.count);
      // ⚠️ {{models}} і {{items}} — число РАЗОМ зі скло­ненним словом.
      // Навіщо: у CMS-шаблонах форма іменника була зашита текстом («{{count}} моделей»),
      // тож вона була правильною лише для частини чисел. На /nakladki з 43 товарами
      // у видачу йшло «43 моделей» замість «43 моделі» — обома мовами.
      // Тепер слово узгоджується з числом автоматично й не ламається, коли асортимент росте.
      case "models": {
        const n = arg ? productsForSlug(arg).length : ctx.current.count;
        return `${n} ${pluralModels(n, ctx.locale)}`;
      }
      case "items": {
        const n = arg ? productsForSlug(arg).length : ctx.current.count;
        return `${n} ${pluralItems(n, ctx.locale)}`;
      }
      case "price_from": {
        const v = arg ? minPriceOf(productsForSlug(arg), ctx.overrides) : ctx.current.minPrice;
        return v != null ? formatPrice(v) : "";
      }
      case "price": {
        if (!arg) return "";
        const p = getProductBySlug(arg);
        if (!p) return "";
        const v = getMinPrice(applyOverrides(p, ctx.overrides));
        return typeof v === "number" && v > 0 ? formatPrice(v) : "";
      }
      default:
        return whole; // невідомий токен лишаємо як є
    }
  });
}

/** Розкриває токени в усіх текстових полях контентного блоку. */
export function expandContentBlock(
  block: ContentBlock | null,
  ctx: TokenContext,
): ContentBlock | null {
  if (!block) return block;
  return {
    ...block,
    metaTitle: expandTokens(block.metaTitle, ctx),
    metaDescription: expandTokens(block.metaDescription, ctx),
    intro: expandTokens(block.intro, ctx),
    body: expandTokens(block.body, ctx),
    faq: block.faq?.map((f) => ({
      q: expandTokens(f.q, ctx) ?? f.q,
      a: expandTokens(f.a, ctx) ?? f.a,
    })),
    comparison: block.comparison
      ? {
          ...block.comparison,
          heading: expandTokens(block.comparison.heading, ctx),
          note: expandTokens(block.comparison.note, ctx),
          rows: block.comparison.rows.map((r) => ({
            ...r,
            cells: r.cells.map((c) => expandTokens(c, ctx) ?? c),
          })),
        }
      : undefined,
  };
}

/** Множина для «позиція/позиції/позицій» (uk) та «позиция/позиции/позиций» (ru). */
export function pluralItems(n: number, locale: Locale): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (locale === "ru") {
    if (m10 === 1 && m100 !== 11) return "позиция";
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "позиции";
    return "позиций";
  }
  if (m10 === 1 && m100 !== 11) return "позиція";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "позиції";
  return "позицій";
}

/** Множина для «модель/моделі/моделей» (uk) та «модель/модели/моделей» (ru). */
export function pluralModels(n: number, locale: Locale): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (locale === "ru") {
    if (m10 === 1 && m100 !== 11) return "модель";
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "модели";
    return "моделей";
  }
  if (m10 === 1 && m100 !== 11) return "модель";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "моделі";
  return "моделей";
}
