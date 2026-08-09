// src/data/catalog/index.ts
// Единая точка доступа к данным КАТАЛОГА + хелперы-селекторы для товарных страниц.
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProduct,
  CatalogSeries,
  CatalogVariant,
  Color,
} from "@/types/catalog";
import { catalogProducts } from "./products";
import { catalogBases } from "./bases";
import { catalogGear } from "./gear";
import { catalogTables } from "./tables";
import { catalogRackets } from "./rackets";
import { catalogBrands, catalogSeries } from "./brands";
import { catalogCategories } from "./categories";
import { rubberFilters } from "./filters";
import { buildCrossSellGraph } from "@/lib/catalog/cross-sell";

export {
  catalogProducts,
  catalogBases,
  catalogGear,
  catalogTables,
  catalogRackets,
  catalogBrands,
  catalogSeries,
  catalogCategories,
  rubberFilters,
};

/** Спільний пул товарів: накладки (rubber) + основи (base) + екіпірування (gear) + столи. */
const pool: CatalogProduct[] = [
  ...catalogProducts,
  ...catalogBases,
  ...catalogGear,
  ...catalogTables,
  ...catalogRackets,
];

/* ---------- Товары ---------- */

export const getAllProducts = (): CatalogProduct[] => pool;

export const getProductBySlug = (slug: string): CatalogProduct | undefined =>
  pool.find((p) => p.slug === slug);

export const getProductsByCategory = (categorySlug: string): CatalogProduct[] =>
  pool.filter((p) => p.categorySlug === categorySlug);

export const getProductsByBrand = (brandSlug: string): CatalogProduct[] =>
  pool.filter((p) => p.brandSlug === brandSlug);

export const getProductsByBrandCategory = (
  brandSlug: string,
  categorySlug: string,
): CatalogProduct[] =>
  pool.filter((p) => p.brandSlug === brandSlug && p.categorySlug === categorySlug);

export const getProductsBySeries = (seriesSlug: string): CatalogProduct[] =>
  pool.filter((p) => p.seriesSlug === seriesSlug);

/**
 * Кандидати для блоку «з цим купують» / «схожі товари».
 *
 * Логіка підбору — у src/lib/catalog/cross-sell.ts (скоринг за сумісністю + вирівнювання
 * графа). Раніше сусіди бралися за алфавітом слага, через що блок радив несумісні товари
 * (OFF+ флагман → OFF− універсал утричі дешевший), а 14 money-карток мали нуль вхідних.
 *
 * ⚠️ ВАЖЛИВО: повертає ШИРШИЙ пул (не рівно 4). Викликач сам застосовує filterVisible()
 * (ховає товари без фото) і вже ПОТІМ бере перші 4 — `getCrossSell(...).slice(0, 4)`.
 * Якщо різати до 4 тут, у прихованих категоріях (одяг) ті 4 сусіди часто ВСІ приховані →
 * після filterVisible блок порожній (баг: 46 з 47 карток одягу лишались без крос-селу).
 */
let crossSellGraph: Map<string, string[]> | null = null;

/** Граф будується один раз на процес — скоринг по всьому пулу недешевий. */
function graph(): Map<string, string[]> {
  if (!crossSellGraph) crossSellGraph = buildCrossSellGraph(pool);
  return crossSellGraph;
}

export const getCrossSell = (product: CatalogProduct): CatalogProduct[] =>
  (graph().get(product.slug) ?? [])
    .map((slug) => getProductBySlug(slug))
    .filter((p): p is CatalogProduct => Boolean(p));

/* ---------- Бренды / серии / категории ---------- */

export const getBrandBySlug = (slug: string): CatalogBrand | undefined =>
  catalogBrands.find((b) => b.slug === slug);

export const getActiveBrands = (): CatalogBrand[] => catalogBrands.filter((b) => b.isActive);

export const getCategoryBySlug = (slug: string): CatalogCategory | undefined =>
  catalogCategories.find((c) => c.slug === slug);

export const getIndexableCategories = (): CatalogCategory[] =>
  [...catalogCategories].filter((c) => c.isIndexable).sort((a, b) => a.sort - b.sort);

export const getSeriesByBrand = (brandSlug: string): CatalogSeries[] =>
  catalogSeries.filter((s) => s.brandSlug === brandSlug);

/* ---------- URL helpers (дерево ЧПУ из ТЗ; локаль добавляет роутинг [locale]) ---------- */

/** Путь карточки без локали: /{brand}/{category}/{slug}. В Link добавляйте префикс локали. */
export const getProductPath = (product: CatalogProduct): string =>
  `/${product.brandSlug}/${product.categorySlug}/${product.slug}`;

export const getCategoryPath = (categorySlug: string): string => `/${categorySlug}`;
export const getBrandPath = (brandSlug: string): string => `/${brandSlug}`;
export const getBrandCategoryPath = (brandSlug: string, categorySlug: string): string =>
  `/${brandSlug}/${categorySlug}`;

/** Версия с локалью для <Link href>. */
export const withLocale = (locale: string, path: string): string => `/${locale}${path}`;

/* ---------- Цена / наличие (агрегаты по вариантам) ---------- */

export const getMinPrice = (product: CatalogProduct): number | undefined => {
  const prices = product.variants
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number");
  return prices.length > 0
    ? Math.min(...prices)
    : typeof product.priceFrom === "number"
      ? product.priceFrom
      : undefined;
};

export const isInStock = (product: CatalogProduct): boolean =>
  product.variants.some((v) => v.inStock === true) || product.inStock === true;

export const getVariant = (
  product: CatalogProduct,
  thickness: string,
  color: Color,
): CatalogVariant | undefined =>
  product.variants.find((v) => v.thickness === thickness && v.color === color);

/**
 * Дата, з якої діють ціни каталогу, YYYY-MM-DD → йде в `validFrom` розмітки Offer.
 *
 * ⚠️ ОНОВЛЮВАТИ РАЗОМ ІЗ ПРАЙСОМ. Google читає `validFrom` як «з якого числа діє ця
 * ціна», і разом із `priceValidUntil` це заявлений строк дії. Забути її тут — значить
 * сказати пошуковику, що ціна не мінялась із зазначеної дати, хоча вона вже інша.
 *
 * Поточне значення — дата останньої зміни цін у даних каталогу (округлення
 * екіпірування до гривні, `git log` по gear.ts). Для товарів, у яких ціна перекрита
 * через адмінку, береться точніша дата з `product_overrides.updated_at`.
 */
export const PRICE_LIST_EFFECTIVE_DATE = "2026-08-06";
