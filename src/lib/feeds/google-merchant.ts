// src/lib/feeds/google-merchant.ts
// Товарний фід Google Merchant Center (безкоштовні оголошення + Shopping) — RSS 2.0 з
// простором імен g:, окремий на кожну мову. Віддається маршрутом
// /{locale}/google-merchant.xml, Merchant Center забирає його за розкладом.
//
// Специфікація: https://support.google.com/merchants/answer/7052112 (Product data specification).
//
// ⚠️ ВСЕ, ЩО ЙДЕ У ФІД, МУСИТЬ ЗБІГАТИСЯ З КАРТКОЮ: ціна, акція, наявність, доставка.
// Google сам переходить на сторінку й звіряє — розбіжність = товар відхилено. Тому числа
// не вписуються руками, а беруться з тих самих джерел, що й сторінка:
//   ціна/наявність  → код + product_overrides (applyOverrides), ракетки — resolveCombo;
//   акція           → promos.ts (накладки) і знижка збірки (ракетки), як на картці;
//   доставка        → site_settings через resolveContact (те, що бачить покупець у кошику);
//   строки          → config/delivery.ts (ті самі, що на /delivery, у чекауті й розмітці Offer);
//   характеристики  → lib/catalog/spec-rows.ts (та сама таблиця, що на картці).
//
// ⚠️ ФОТО — БЕЗ водяного знака TTMAX, хоча на сайті він є: Merchant Center відхиляє зображення
// з накладками (водяні знаки, логотипи, текст). Оригінали в Cloudinary чисті — знак живе
// лише в URL доставки сайту.
//
// ⚠️ GTIN (штрихкодів) у каталозі немає. Ставити identifier_exists=no НЕ МОЖНА: у товарів
// Butterfly штрихкоди є, і це було б хибне твердження. Без GTIN товар показується, але з
// попередженням «обмежена ефективність». Коли зʼявляться коди з прайсу постачальника —
// додати поле gtin у дані й сюди.
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import {
  getAllProducts,
  getBrandBySlug,
  getCategoryBySlug,
  getMinPrice,
  getProductBySlug,
  isInStock,
} from "@/data/catalog";
import { promoOldPrice } from "@/data/catalog/promos";
import { VARIANTS, expertFor, variantOf } from "@/data/catalog/variants";
import { applyOverrides, type OverridesMap } from "@/lib/catalog/overrides";
import { isHidden } from "@/lib/catalog/hidden";
import { isRacket, resolveCombo } from "@/lib/catalog/racket";
import { labelFor } from "@/lib/catalog/routing";
import {
  BLADE_SURFACE_LABEL,
  baseSpecRows,
  gearTypeLabel,
  productSpecRows,
  rubberSpecRows,
  type SpecRow,
} from "@/lib/catalog/spec-rows";
import { pickAll, type EntityMediaMap } from "@/lib/media/get";
import { productLdDescription } from "@/lib/seo/product-copy";
import { DELIVERY_DAYS } from "@/config/delivery";
import type { BladeClass, BladeSurface, CatalogProduct, Handle } from "@/types/catalog";

const CURRENCY = "UAH";
const COUNTRY = "UA";
// Та сама хмара, що й у сайту (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME); запасне значення — для
// локальної перевірки фіду скриптом, де env немає.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dh6vuxjko";
/** Ліміти специфікації Google. */
const MAX = { id: 50, title: 150, description: 5000, highlight: 150, highlights: 10, images: 10 };

export type MerchantFeedInput = {
  locale: Locale;
  media: EntityMediaMap;
  overrides: OverridesMap;
  /** Доставка з site_settings (resolveContact): поріг безкоштовної й тарифи перевізників. */
  delivery: { freeShippingThreshold: number; shippingFee: number; ukrposhtaFee: number };
};

type Detail = { section: string; name: string; value: string };

/** Один рядок фіду = одна пропозиція (варіант товару). */
export type MerchantItem = {
  id: string;
  itemGroupId?: string;
  title: string;
  shortTitle?: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: "in_stock" | "out_of_stock";
  price: number;
  salePrice?: number;
  brand: string;
  googleProductCategory: number;
  productType: string;
  isBundle?: boolean;
  color?: string;
  size?: string;
  sizeSystem?: string;
  gender?: "male" | "female" | "unisex";
  ageGroup?: "adult";
  highlights: string[];
  details: Detail[];
  customLabels: string[];
};

const T = {
  sport: { ua: "Настільний теніс", ru: "Настольный теннис" },
  forTT: { ua: "для настільного тенісу", ru: "для настольного тенниса" },
  forBlade: { ua: "для ракетки настільного тенісу", ru: "для ракетки настольного тенниса" },
  size: { ua: "розмір", ru: "размер" },
  color: { ua: "колір", ru: "цвет" },
  specs: { ua: "Характеристики", ru: "Характеристики" },
  thicknesses: { ua: "Товщини губки", ru: "Толщины губки" },
  colors: { ua: "Кольори", ru: "Цвета" },
  handles: { ua: "Ручки", ru: "Ручки" },
  model: { ua: "Модель", ru: "Модель" },
  blade: { ua: "Основа", ru: "Основание" },
  fh: { ua: "Накладка FH", ru: "Накладка FH" },
  bh: { ua: "Накладка BH", ru: "Накладка BH" },
  assembled: { ua: "Зібрана майстром, готова до гри.", ru: "Собрана мастером, готова к игре." },
  bothSides: { ua: "з обох боків", ru: "с обеих сторон" },
  rubber: { ua: "Накладки з обох боків", ru: "Накладки с обеих сторон" },
  forWhom: { ua: "Кому підходить", ru: "Кому подходит" },
} satisfies Record<string, Record<Locale, string>>;

const VOLUME_WORD: Record<Locale, string> = { ua: "Обʼєм", ru: "Объём" };

const RUBBER_COLOR: Record<string, Record<Locale, string>> = {
  red: { ua: "червоний", ru: "красный" },
  black: { ua: "чорний", ru: "черный" },
};

const HANDLE: Record<Handle, Record<Locale, string>> = {
  fl: { ua: "FL (конічна)", ru: "FL (коническая)" },
  st: { ua: "ST (пряма)", ru: "ST (прямая)" },
  an: { ua: "AN (анатомічна)", ru: "AN (анатомическая)" },
  cs: { ua: "CS (китайське перо)", ru: "CS (китайское перо)" },
};

/** Короткі позначення для заголовка основи: «ALC, OFF+». Довгі підписи — у характеристиках. */
const SURFACE_SHORT: Record<BladeSurface, Record<Locale, string>> = {
  wood: { ua: "дерево", ru: "дерево" },
  alc: { ua: "ALC", ru: "ALC" },
  "super-alc": { ua: "Super ALC", ru: "Super ALC" },
  zlc: { ua: "ZLC", ru: "ZLC" },
  "super-zlc": { ua: "Super ZLC", ru: "Super ZLC" },
  zlf: { ua: "ZLF", ru: "ZLF" },
  t5000: { ua: "T5000", ru: "T5000" },
  cnf: { ua: "CNF", ru: "CNF" },
  caf: { ua: "CAF", ru: "CAF" },
  carbon: { ua: "карбон", ru: "карбон" },
};
const CLASS_SHORT: Record<BladeClass, string> = {
  "off-plus": "OFF+",
  off: "OFF",
  "off-minus": "OFF-",
  "all-plus": "ALL+",
  all: "ALL",
  def: "DEF",
};

/**
 * Колір у назві («Кросівки … (сині)») → значення атрибута color. Окремого поля кольору в
 * екіпірування немає, а для одягу й взуття Google його чекає.
 */
const NAME_COLOR: Record<string, Record<Locale, string>> = {
  сині: { ua: "синій", ru: "синий" },
  синие: { ua: "синій", ru: "синий" },
  чорні: { ua: "чорний", ru: "черный" },
  черные: { ua: "чорний", ru: "черный" },
  чёрные: { ua: "чорний", ru: "черный" },
  рожеві: { ua: "рожевий", ru: "розовый" },
  розовые: { ua: "рожевий", ru: "розовый" },
  білі: { ua: "білий", ru: "белый" },
  белые: { ua: "білий", ru: "белый" },
  червоні: { ua: "червоний", ru: "красный" },
  красные: { ua: "червоний", ru: "красный" },
  сірі: { ua: "сірий", ru: "серый" },
  серые: { ua: "сірий", ru: "серый" },
};

function nameColor(p: CatalogProduct, locale: Locale): string | undefined {
  for (const m of p.name[locale].matchAll(/\(([^)]+)\)/g)) {
    const c = NAME_COLOR[(m[1] ?? "").trim().toLowerCase()];
    if (c) return c[locale];
  }
  return undefined;
}

/**
 * Google product taxonomy (en-US, ID). Найточніша категорія за видом товару:
 * 1008 Ping Pong, 3375 Paddles & Sets, 3900 Paddle Accessories, 3964 Balls, 3788 Nets & Posts,
 * 3345 Tables; одяг, взуття й сумки — у загальних гілках Apparel / Luggage & Bags.
 */
const GEAR_TAXONOMY: Record<string, number> = {
  tshirt: 212, // Clothing > Shirts & Tops
  sweater: 212,
  shorts: 207, // Clothing > Shorts
  skirt: 1581, // Clothing > Skirts
  jacket: 5598, // Outerwear > Coats & Jackets
  track: 5598,
  suit: 5322, // Clothing > Activewear (спортивні костюми)
  pants: 204, // Clothing > Pants
  socks: 209, // Underwear & Socks > Socks
  cap: 173, // Clothing Accessories > Hats
  shoes: 187, // Apparel & Accessories > Shoes
  slippers: 187,
  insole: 2801, // Foot Care > Insoles & Inserts
  towel: 4077, // Linens & Bedding > Towels
  bottle: 3809, // Food & Beverage Carriers > Water Bottles
  bag: 103, // Luggage & Bags > Duffel Bags
  backpack: 100, // Luggage & Bags > Backpacks
  "shoe-bag": 2301, // Shoe Care & Tools > Shoe Bags
  "ball-bag": 7397, // General Purpose Athletic Equipment > Ball Carrying Bags & Carts
  "ball-tube": 1008,
  case: 3900, // Ping Pong Paddle Accessories (чохли для ракетки)
  glue: 3900,
  cleaner: 3900,
  care: 3900,
  sponge: 3900,
  "edge-tape": 3900,
  overgrip: 3900,
  film: 3900,
  balls: 3964,
  net: 3788,
  table: 3345,
};

function taxonomy(p: CatalogProduct): number {
  if (isRacket(p) || p.base) return 3375;
  if (p.gear) {
    // Пов'язки: напульсник — Wristbands (1893), на голову — Headbands (1662).
    if (p.gear.gearType === "band") return /напульс/i.test(p.name.ua) ? 1893 : 1662;
    return GEAR_TAXONOMY[p.gear.gearType] ?? 1008;
  }
  return 3900; // накладки
}

/** «Накладка Butterfly Dignics 05 — купити в Україні | TTMAX» → «Накладка Butterfly Dignics 05». */
function baseTitle(p: CatalogProduct, locale: Locale): string {
  const t = p.title?.[locale] ?? p.name[locale];
  return (t.split(/\s+[—-]\s+(?:купити|купить)/i)[0] ?? t)
    .replace(/\s*\|\s*TTMAX$/, "")
    .trim();
}

const mentionsTT = (s: string) => /тен(н)?іс|тенис|теннис/i.test(s);

/**
 * Заголовок: тип + бренд + модель + «для настільного тенісу» + ключові атрибути.
 * Саме з заголовка Google вирішує, на які запити показувати товар, тож вид спорту
 * дописуємо явно — «Футболка Butterfly Kisa» сама по собі тенісною не читається.
 */
function itemTitle(p: CatalogProduct, locale: Locale): string {
  let t = baseTitle(p, locale);
  if (p.base) {
    t = `${t} ${T.forBlade[locale]}`;
    const attrs: string[] = [];
    const surface = SURFACE_SHORT[p.base.surface][locale];
    if (!t.toLowerCase().includes(surface.toLowerCase())) attrs.push(surface);
    attrs.push(CLASS_SHORT[p.base.bladeClass]);
    return `${t}, ${attrs.join(", ")}`;
  }
  return mentionsTT(t) ? t : `${t} ${T.forTT[locale]}`;
}

/** Прибирає з тексту обіцянки, які Google просить не писати в описі (доставка, подарунки). */
const stripPromo = (s: string) =>
  s.replace(/\s*При (?:купівлі|покупке)[^.]*\./g, "").replace(/\s{2,}/g, " ").trim();

const sentence = (s: string) => {
  const t = s.trim();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
};

const specsLine = (rows: SpecRow[], locale: Locale) =>
  rows.length ? `${T.specs[locale]}: ${rows.map((r) => `${r.label} — ${r.value}`).join("; ")}.` : "";

/**
 * Опис: експертний вердикт + офіційні дані Butterfly (як у Product JSON-LD), далі
 * особливості, кому підходить і характеристики. Без HTML, без цін і доставки.
 */
function itemDescription(p: CatalogProduct, locale: Locale, rows: SpecRow[]): string {
  const expert = expertFor(p.slug);
  let head =
    productLdDescription(p, locale) ??
    (p.description?.[locale] ? stripPromo(p.description[locale]) : undefined) ??
    `${baseTitle(p, locale)}.`;
  // Варіант обʼєму клею бере опис основної картки, а там обʼєм основної моделі (90 мл).
  // У фіді це суперечило б розміру рядка — тож обʼєм основної прибираємо, ставимо свій.
  const variant = variantOf(p.slug);
  if (variant?.kind === "volume")
    head = `${head.replace(/\s*(?:Об['ʼ]єм|Объём):\s*\d+\s*мл\.?/g, "")} ${VOLUME_WORD[locale]}: ${variant.label[locale]}.`;
  const parts = [sentence(head)];
  if (expert) {
    for (const f of expert.features) parts.push(sentence(f[locale]));
    if (expert.audienceFor.length)
      parts.push(`${T.forWhom[locale]}: ${expert.audienceFor.map((a) => a[locale].replace(/[.]$/, "")).join("; ")}.`);
  }
  // Збірка: що саме в комплекті — вердикти основи й накладок з їхніх карток.
  if (isRacket(p) && p.combo) {
    const blade = getProductBySlug(p.combo.blade);
    const fh = getProductBySlug(p.combo.fh);
    const bh = getProductBySlug(p.combo.bh);
    // «Основа Viscaria — еталонна …»: вердикт із малої літери, якщо він починається не з назви.
    const v = (part?: CatalogProduct) => {
      const t = part ? expertFor(part.slug)?.verdict[locale] : undefined;
      return t ? sentence(/^[А-ЯІЇЄҐЁ][а-яіїєґё]/.test(t) ? t[0]!.toLowerCase() + t.slice(1) : t) : undefined;
    };
    if (blade && v(blade)) parts.push(`${T.blade[locale]} ${blade.model} — ${v(blade)}`);
    if (fh && v(fh)) parts.push(`${fh.slug === bh?.slug ? T.rubber[locale] : T.fh[locale]} ${fh.model} — ${v(fh)}`);
    if (bh && bh.slug !== fh?.slug && v(bh)) parts.push(`${T.bh[locale]} ${bh.model} — ${v(bh)}`);
  }
  // Таблиця характеристик — лише там, де немає офіційних даних Butterfly в експертному
  // тексті: у накладок шкала таблиці картки інша, ніж у Butterfly, і два різні «швидкість»
  // поруч в одному описі читались би як суперечність.
  if (!expert) parts.push(specsLine(rows, locale));
  let text = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (text.length > MAX.description) {
    // Ріжемо по межі речення, а не посеред слова.
    const cut = text.slice(0, MAX.description);
    text = cut.slice(0, Math.max(cut.lastIndexOf(". ") + 1, MAX.description - 200)).trim();
  }
  return text;
}

/** Ключові переваги (product_highlight): пункти «Особливості» з експертного блоку. */
function itemHighlights(p: CatalogProduct, locale: Locale): string[] {
  const out: string[] = [];
  for (const f of expertFor(p.slug)?.features ?? []) {
    let s = f[locale].trim().replace(/\s+/g, " ");
    if (s.length > MAX.highlight) {
      // Перше речення, якщо влазить; інакше пункт пропускаємо — обрізаний посеред думки гірший.
      const first = s.split(/(?<=[.!?])\s/)[0] ?? s;
      if (first.length > MAX.highlight) continue;
      s = first;
    }
    out.push(s);
    if (out.length >= MAX.highlights) break;
  }
  return out;
}

/** JPEG без водяного знака, до 1600 px. */
const imageUrl = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUD}/image/upload/f_jpg,q_auto:good,c_limit,w_1600,h_1600/${encodeURI(publicId)}.jpg`;

/** FNV-1a → base36: короткий стабільний хвіст для задовгих id. */
function hash36(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).padStart(7, "0");
}

/**
 * id пропозиції — ≤ 50 символів ASCII (ліміт Google). Короткі лишаються читабельними
 * (`dignics-05__2.1__red`); довші — префікс + хеш. Id мусить бути СТАБІЛЬНИМ: зміна id =
 * для Google новий товар без історії, тож формулу не міняти без потреби.
 */
export function feedId(raw: string): string {
  if (/^[A-Za-z0-9._-]+$/.test(raw) && raw.length <= MAX.id) return raw;
  const safe = raw.replace(/[^A-Za-z0-9._-]+/g, "-");
  return `${safe.slice(0, MAX.id - 8)}-${hash36(raw).slice(0, 7)}`;
}

/**
 * item_group_id — окремий простір від id: інакше в клею основна картка мала б id, що
 * дорівнює id групи (Google просить їх не змішувати).
 */
const groupId = (slug: string) => feedId(`g-${slug}`);

function priceBand(n: number): string {
  if (n < 1000) return "0-999";
  if (n < 3000) return "1000-2999";
  if (n < 6000) return "3000-5999";
  return "6000+";
}

/** Шлях у нашому каталозі для product_type: «Настільний теніс > Накладки > Гладкі». */
function productType(p: CatalogProduct, locale: Locale): string {
  const cat = getCategoryBySlug(p.categorySlug)?.name[locale];
  const path: (string | undefined)[] = [T.sport[locale], cat];
  // Ракетки — за основою: «Готові ракетки > Viscaria» групує всі збірки однієї основи.
  if (isRacket(p)) path.push(p.combo ? getProductBySlug(p.combo.blade)?.model : undefined);
  else if (p.base) path.push(BLADE_SURFACE_LABEL[p.base.surface]);
  else if (p.gear) path.push(gearTypeLabel(p.gear.gearType, locale));
  else {
    if (p.surfaceType) path.push(labelFor("surfaceType", p.surfaceType, locale));
    if (p.playStyle && p.playStyle !== p.surfaceType) path.push(labelFor("playStyle", p.playStyle, locale));
  }
  // Без повторів сусідніх рівнів: «Мʼячі > Мʼячі» нічого не уточнює.
  return path
    .filter((v): v is string => Boolean(v))
    .filter((v, i, a) => i === 0 || v.toLowerCase() !== a[i - 1]!.toLowerCase())
    .join(" > ");
}

const GENDER = { men: "male", women: "female", unisex: "unisex" } as const;
const APPAREL = new Set(["odyag", "obuv"]);

/**
 * Пропозиції фіду для однієї мови.
 *
 * Варіанти: накладка — рядок на товщину × колір; одяг і взуття — на розмір; чохол із
 * кількома розфарбуваннями — на колір. Ціна й наявність у нас від розміру/кольору не
 * залежать (перевірено: 0 накладок із різною ціною варіантів), тож сторінка товару
 * показує ту саму ціну для будь-якого рядка групи.
 */
export function buildMerchantItems(input: MerchantFeedInput): MerchantItem[] {
  const { locale, media, overrides } = input;
  const site = siteConfig.url;
  const items: MerchantItem[] = [];

  for (const raw of getAllProducts()) {
    if (isHidden(raw, media)) continue;
    const p = applyOverrides(raw, overrides);
    const brand = getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug;
    const link = `${site}/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`;

    // ── Ціна (як на картці) ──
    let price = getMinPrice(p);
    let oldPrice = promoOldPrice(p.slug, price);
    let images = pickAll(media, "product", p.slug).map((m) => m.publicId);
    let rows = productSpecRows(p, locale);
    const details: Detail[] = [];
    const highlights = itemHighlights(p, locale);
    let isBundle = false;

    if (isRacket(p)) {
      const combo = resolveCombo(p, overrides);
      price = combo.promoPrice;
      oldPrice = combo.oldPrice;
      isBundle = true;
      // Своїх фото в збірки немає — як і сторінка, показуємо компоненти: спершу основа.
      images = [
        ...(combo.blade ? pickAll(media, "product", combo.blade.slug).map((m) => m.publicId) : []),
        ...[combo.fh, combo.bh]
          .filter(
            (part, i, all): part is CatalogProduct =>
              Boolean(part) && all.findIndex((o) => o?.slug === part?.slug) === i,
          )
          .map((part) => pickAll(media, "product", part.slug)[0]?.publicId)
          .filter((id): id is string => Boolean(id)),
      ];
      rows = [];
      const same = combo.fh && combo.bh && combo.fh.slug === combo.bh.slug;
      if (combo.blade) {
        for (const r of baseSpecRows(combo.blade, locale))
          details.push({ section: `${T.blade[locale]} ${combo.blade.model}`, name: r.label, value: r.value });
        highlights.push(
          `${T.blade[locale]}: ${combo.blade.model} — ${SURFACE_SHORT[combo.blade.base!.surface][locale]}, ${CLASS_SHORT[combo.blade.base!.bladeClass]}`,
        );
      }
      for (const [key, part] of [
        ["fh", combo.fh],
        ["bh", same ? undefined : combo.bh],
      ] as const) {
        if (!part) continue;
        const label = same ? `${T.fh[locale].replace(" FH", "")} (${T.bothSides[locale]})` : T[key][locale];
        for (const r of rubberSpecRows(part, locale))
          details.push({ section: `${label} ${part.model}`, name: r.label, value: r.value });
        highlights.push(`${label}: ${part.model}`);
      }
      highlights.push(T.assembled[locale].replace(/\.$/, ""));
    } else {
      for (const r of rows) details.push({ section: T.specs[locale], name: r.label, value: r.value });
      if (p.variants.length) {
        details.push({ section: T.specs[locale], name: T.thicknesses[locale], value: p.thicknessOptions.join(", ") });
        details.push({
          section: T.specs[locale],
          name: T.colors[locale],
          value: p.colors.map((c) => RUBBER_COLOR[c]?.[locale] ?? c).join(", "),
        });
      }
      if (p.base?.handles.length)
        details.push({ section: T.specs[locale], name: T.handles[locale], value: p.base.handles.map((h) => HANDLE[h][locale]).join(", ") });
    }

    if (!(typeof price === "number" && price > 0)) continue; // «ціна за запитом» — не пропозиція
    const mainImage = images[0];
    if (!mainImage) continue; // Google не приймає товар без фото
    const current: number = price;

    const variant = variantOf(p.slug);
    const color = nameColor(p, locale);
    const sale = typeof oldPrice === "number" && oldPrice > current;
    const common: Omit<MerchantItem, "id" | "title"> = {
      itemGroupId: undefined,
      shortTitle: baseTitle(p, locale).slice(0, MAX.title),
      description: itemDescription(p, locale, rows),
      link,
      imageLink: imageUrl(mainImage),
      additionalImageLinks: images.slice(1, 1 + MAX.images).map(imageUrl),
      availability: isInStock(p) ? "in_stock" : "out_of_stock",
      // Акція: price — звичайна ціна, sale_price — поточна (на сайті: закреслена й актуальна).
      price: sale ? (oldPrice as number) : current,
      salePrice: sale ? current : undefined,
      brand,
      googleProductCategory: taxonomy(p),
      productType: productType(p, locale),
      isBundle: isBundle || undefined,
      color,
      gender: p.gear?.gender ? GENDER[p.gear.gender] : undefined,
      ageGroup: APPAREL.has(p.categorySlug) ? "adult" : undefined,
      sizeSystem: p.gear?.gearType === "shoes" ? "EU" : undefined,
      highlights: highlights.slice(0, MAX.highlights),
      details,
      customLabels: [
        p.categorySlug,
        priceBand(current),
        sale ? "sale" : "regular",
        `priority-${p.priority}`,
        p.level,
      ],
    };
    const title = itemTitle(p, locale);

    // Обʼєм клею: варіанти заведені окремими товарами (variants.ts) — групуємо з основною
    // моделлю, обʼєм іде як size. Колір кросівок не групуємо: у основної картки Rifones колір
    // не вказаний, а в групі він мусить бути в кожного рядка.
    const volumeGroup =
      variant?.kind === "volume" || VOLUME_MAINS.has(p.slug) ? (variant?.main ?? p.slug) : undefined;
    const volume = p.gear?.volumeMl ? `${p.gear.volumeMl} мл` : variant?.kind === "volume" ? variant.label[locale] : undefined;

    // ── Накладки: товщина × колір ──
    const rubberVariants = p.variants.filter((v) => typeof v.price === "number" && v.price > 0);
    if (rubberVariants.length > 1) {
      for (const v of rubberVariants) {
        const th = /^\d/.test(v.thickness) ? `${v.thickness} мм` : v.thickness;
        const colorName = labelFor("color", v.color, locale).toLowerCase();
        items.push({
          ...common,
          id: feedId(`${p.slug}__${v.thickness}__${v.color}`),
          itemGroupId: groupId(p.slug),
          title: `${title} — ${th}, ${colorName}`.slice(0, MAX.title),
          color: RUBBER_COLOR[v.color]?.[locale] ?? v.color,
          size: th,
          availability: v.inStock === true ? "in_stock" : "out_of_stock",
        });
      }
      continue;
    }

    // ── Одяг і взуття: розмір ──
    const sizes = p.gear?.sizes ?? [];
    if (sizes.length > 1) {
      for (const size of sizes) {
        items.push({
          ...common,
          id: feedId(`${p.slug}__${size}`),
          itemGroupId: groupId(p.slug),
          title: `${title} — ${T.size[locale]} ${size}`.slice(0, MAX.title),
          size,
        });
      }
      continue;
    }

    // ── Розфарбування (чохол у кількох кольорах) ──
    const colorways = p.gear?.colorways ?? [];
    if (colorways.length > 1) {
      for (const c of colorways) {
        items.push({
          ...common,
          id: feedId(`${p.slug}__${c.ua}`),
          itemGroupId: groupId(p.slug),
          title: `${title} — ${T.color[locale]} ${c[locale]}`.slice(0, MAX.title),
          color: c[locale],
        });
      }
      continue;
    }

    items.push({
      ...common,
      id: feedId(p.slug),
      itemGroupId: volumeGroup && volume ? groupId(volumeGroup) : undefined,
      title: title.slice(0, MAX.title),
      size: sizes.length === 1 ? sizes[0] : volumeGroup ? volume : undefined,
    });
  }
  return items;
}

/** Основні моделі клею, у яких є варіанти обʼєму (щоб основна картка теж мала item_group_id). */
const VOLUME_MAINS = new Set(
  Object.values(VARIANTS)
    .filter((v) => v.kind === "volume")
    .map((v) => v.main),
);

/* ───────────────────────── XML ───────────────────────── */

/** Екранування для XML + прибирання керівних символів, яких XML 1.0 не допускає. */
const x = (s: string) =>
  s
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const money = (n: number) => `${n.toFixed(2)} ${CURRENCY}`;
const tag = (name: string, value: string | number | undefined) =>
  value === undefined || value === "" ? "" : `<g:${name}>${x(String(value))}</g:${name}>`;

function itemXml(it: MerchantItem, delivery: MerchantFeedInput["delivery"]): string {
  const effective = it.salePrice ?? it.price;
  // Безкоштовна доставка від порогу — як у кошику й у розмітці Offer; інакше тариф перевізника.
  const free = effective >= delivery.freeShippingThreshold;
  // Строк у дорозі — свій у кожного перевізника (config/delivery.ts, як на /delivery і на чекауті).
  const shipping = [
    { service: "Нова Пошта", fee: delivery.shippingFee, transit: DELIVERY_DAYS.np },
    { service: "Укрпошта", fee: delivery.ukrposhtaFee, transit: DELIVERY_DAYS.ukrposhta },
  ]
    .filter((o) => Number.isFinite(o.fee) && o.fee >= 0)
    .map(
      (o) =>
        `<g:shipping><g:country>${COUNTRY}</g:country><g:service>${x(o.service)}</g:service>` +
        `<g:price>${money(free ? 0 : o.fee)}</g:price>` +
        `<g:min_transit_time>${o.transit.min}</g:min_transit_time>` +
        `<g:max_transit_time>${o.transit.max}</g:max_transit_time></g:shipping>`,
    );

  const lines = [
    tag("id", it.id),
    tag("item_group_id", it.itemGroupId),
    tag("title", it.title),
    tag("short_title", it.shortTitle !== it.title ? it.shortTitle : undefined),
    tag("description", it.description),
    tag("link", it.link),
    tag("image_link", it.imageLink),
    ...it.additionalImageLinks.map((u) => tag("additional_image_link", u)),
    tag("availability", it.availability),
    tag("price", money(it.price)),
    it.salePrice !== undefined ? tag("sale_price", money(it.salePrice)) : "",
    tag("condition", "new"),
    tag("brand", it.brand),
    tag("google_product_category", it.googleProductCategory),
    tag("product_type", it.productType),
    it.isBundle ? tag("is_bundle", "yes") : "",
    tag("color", it.color),
    tag("size", it.size),
    tag("size_system", it.sizeSystem),
    tag("gender", it.gender),
    tag("age_group", it.ageGroup),
    ...it.highlights.map((h) => tag("product_highlight", h)),
    ...it.details.map(
      (d) =>
        `<g:product_detail><g:section_name>${x(d.section.slice(0, 140))}</g:section_name>` +
        `<g:attribute_name>${x(d.name.slice(0, 140))}</g:attribute_name>` +
        `<g:attribute_value>${x(d.value.slice(0, 1000))}</g:attribute_value></g:product_detail>`,
    ),
    ...shipping,
    `<g:free_shipping_threshold><g:country>${COUNTRY}</g:country><g:price_threshold>${money(delivery.freeShippingThreshold)}</g:price_threshold></g:free_shipping_threshold>`,
    tag("min_handling_time", DELIVERY_DAYS.handling.min),
    tag("max_handling_time", DELIVERY_DAYS.handling.max),
    tag("ships_from_country", COUNTRY),
    ...it.customLabels.map((l, i) => tag(`custom_label_${i}`, l)),
  ].filter(Boolean);
  return `<item>\n${lines.join("\n")}\n</item>`;
}

/** Повний XML фіду шматками — маршрут віддає їх потоком (див. route.ts). */
export function* merchantXmlChunks(input: MerchantFeedInput, items = buildMerchantItems(input)): Generator<string> {
  const { locale } = input;
  yield `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n`;
  yield `<title>${x(siteConfig.operator)} — ${x(T.sport[locale])}</title>\n<link>${x(`${siteConfig.url}/${locale}`)}</link>\n`;
  yield `<description>${x(locale === "ru" ? "Оригинальный инвентарь Butterfly для настольного тенниса" : "Оригінальний інвентар Butterfly для настільного тенісу")}</description>\n`;
  for (const it of items) yield `${itemXml(it, input.delivery)}\n`;
  yield `</channel>\n</rss>\n`;
}
