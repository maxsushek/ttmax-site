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
 * ⚠️ ВАЖЛИВО: повертає ШИРШИЙ пул (не рівно 4). Викликач сам застосовує filterVisible()
 * (ховає товари без фото) і вже ПОТІМ бере перші 4 — `getCrossSell(...).slice(0, 4)`.
 * Якщо різати до 4 тут, у прихованих категоріях (одяг) ті 4 сусіди часто ВСІ приховані →
 * після filterVisible блок порожній (баг: 46 з 47 карток одягу лишались без крос-селу).
 *
 * Дедуп-логіка проти дублювання контенту: у 392 з 519 товарів seriesSlug порожній, тож
 * фолбек бере сусідів по КАТЕГОРІЇ. Сусіди СОРТУЮТЬСЯ за slug — інакше findIndex по
 * pool-порядку майже завжди давав start=0 → ті самі 4 товари на більшості карток.
 * Після сортування вікно зсувається на позицію товару → у кожної картки свій набір.
 */
export const getCrossSell = (product: CatalogProduct): CatalogProduct[] => {
  if (product.crossSell && product.crossSell.length > 0) {
    return product.crossSell
      .map((slug) => getProductBySlug(slug))
      .filter((p): p is CatalogProduct => Boolean(p));
  }

  const bySeries = product.seriesSlug
    ? getProductsBySeries(product.seriesSlug).filter((p) => p.slug !== product.slug)
    : [];

  const siblings = getProductsByCategory(product.categorySlug)
    .filter((p) => p.slug !== product.slug && !bySeries.some((s) => s.slug === p.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const idx = siblings.findIndex((p) => p.slug > product.slug);
  const rotated = idx > 0 ? [...siblings.slice(idx), ...siblings.slice(0, idx)] : siblings;

  return [...bySeries, ...rotated];
};

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
