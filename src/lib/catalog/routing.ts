// src/lib/catalog/routing.ts
// Резолвер ЧПУ каталога: один catch-all [locale]/[...segments] раскладывается в тип страницы.
// Категории / бренд-хаб / бренд×категория / товар — всё определяется по данным каталога.
import type { Locale } from "@/i18n/config";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProduct,
  Localized,
} from "@/types/catalog";
import {
  getActiveBrands,
  getBrandBySlug,
  getCategoryBySlug,
  getIndexableCategories,
  getProductBySlug,
  getProductsByBrand,
  getProductsByBrandCategory,
  getProductsByCategory,
  rubberFilters,
} from "@/data/catalog";

export function pickLocalized(value: Localized, locale: Locale): string {
  return value[locale];
}

/** Локализованная подпись значения фильтра (тип поверхности, уровень, цвет, бакеты). */
export function labelFor(key: string, value: string, locale: Locale): string {
  const def = rubberFilters.find((f) => f.key === key);
  const opt = def?.options.find((o) => o.value === value);
  return opt ? opt.label[locale] : value;
}

export type CatalogRoute =
  | { kind: "category"; category: CatalogCategory; products: CatalogProduct[]; index: boolean }
  | {
      kind: "brand";
      brand: CatalogBrand;
      categories: CatalogCategory[];
      products: CatalogProduct[];
      index: boolean;
    }
  | {
      kind: "brandCategory";
      brand: CatalogBrand;
      category: CatalogCategory;
      products: CatalogProduct[];
      index: boolean;
    }
  | {
      kind: "product";
      brand: CatalogBrand;
      category: CatalogCategory;
      product: CatalogProduct;
      index: boolean;
    };

function activeBrand(slug: string): CatalogBrand | undefined {
  const b = getBrandBySlug(slug);
  return b && b.isActive ? b : undefined;
}

/** Раскладывает массив сегментов URL в конкретную страницу каталога (или null → 404). */
export function resolveSegments(segments: string[]): CatalogRoute | null {
  // /{slug} — бренд-хаб или категория
  if (segments.length === 1) {
    const a = segments[0];
    if (!a) return null;

    const brand = activeBrand(a);
    if (brand) {
      const products = getProductsByBrand(brand.slug);
      const categories = getIndexableCategories().filter(
        (c) => getProductsByBrandCategory(brand.slug, c.slug).length > 0,
      );
      return { kind: "brand", brand, categories, products, index: products.length > 0 };
    }

    const category = getCategoryBySlug(a);
    if (category) {
      const products = getProductsByCategory(category.slug);
      return { kind: "category", category, products, index: products.length > 0 };
    }
    return null;
  }

  // /{brand}/{category} — бренд×категория
  if (segments.length === 2) {
    const a = segments[0];
    const b = segments[1];
    if (!a || !b) return null;

    const brand = activeBrand(a);
    const category = getCategoryBySlug(b);
    if (brand && category) {
      const products = getProductsByBrandCategory(brand.slug, category.slug);
      return { kind: "brandCategory", brand, category, products, index: products.length > 0 };
    }
    return null;
  }

  // /{brand}/{category}/{product} — карточка товара
  if (segments.length === 3) {
    const a = segments[0];
    const b = segments[1];
    const c = segments[2];
    if (!a || !b || !c) return null;

    const brand = activeBrand(a);
    const category = getCategoryBySlug(b);
    const product = getProductBySlug(c);
    if (
      brand &&
      category &&
      product &&
      product.brandSlug === brand.slug &&
      product.categorySlug === category.slug
    ) {
      return { kind: "product", brand, category, product, index: true };
    }
    return null;
  }

  return null;
}

/** Все статические пути каталога для generateStaticParams (без локали — её даёт [locale]). */
export function catalogStaticParams(): { segments: string[] }[] {
  const params: { segments: string[] }[] = [];

  // Категории (все индексируемые — для навигации; пустые получат noindex в метаданных).
  for (const c of getIndexableCategories()) params.push({ segments: [c.slug] });

  // Активные бренды с товарами: хаб + бренд×категория + товары.
  for (const brand of getActiveBrands()) {
    const brandProducts = getProductsByBrand(brand.slug);
    if (brandProducts.length === 0) continue;

    params.push({ segments: [brand.slug] });

    for (const c of getIndexableCategories()) {
      if (getProductsByBrandCategory(brand.slug, c.slug).length > 0) {
        params.push({ segments: [brand.slug, c.slug] });
      }
    }
    for (const p of brandProducts) {
      params.push({ segments: [p.brandSlug, p.categorySlug, p.slug] });
    }
  }

  return params;
}

/* ---------- SEO-тексты по типу страницы ---------- */

export function routeTitle(route: CatalogRoute, locale: Locale): string {
  switch (route.kind) {
    case "category":
      return pickLocalized(route.category.title, locale);
    case "brand":
      return pickLocalized(route.brand.title, locale);
    case "brandCategory": {
      const cat = pickLocalized(route.category.name, locale);
      const tail = locale === "uk" ? "купити в Україні" : "купить в Украине";
      return `${cat} ${route.brand.name} — ${tail} | TTMAX`;
    }
    case "product":
      return pickLocalized(route.product.title, locale);
  }
}

export function routeDescription(route: CatalogRoute, locale: Locale): string {
  switch (route.kind) {
    case "category":
      return pickLocalized(route.category.metaDescription, locale);
    case "brand":
      return pickLocalized(route.brand.description, locale);
    case "brandCategory": {
      const cat = pickLocalized(route.category.name, locale).toLowerCase();
      return locale === "uk"
        ? `${route.brand.name}: ${cat} для настільного тенісу. Офіційний товар, гарантія, доставка по Україні.`
        : `${route.brand.name}: ${cat} для настольного тенниса. Официальный товар, гарантия, доставка по Украине.`;
    }
    case "product":
      if (route.product.description) return pickLocalized(route.product.description, locale);
      return locale === "uk"
        ? `Купити ${route.product.name.uk} в Україні. Характеристики, ціна, відгуки. Гарантія, доставка.`
        : `Купить ${route.product.name.ru} в Украине. Характеристики, цена, отзывы. Гарантия, доставка.`;
  }
}

export function routeH1(route: CatalogRoute, locale: Locale): string {
  switch (route.kind) {
    case "category":
      return pickLocalized(route.category.h1, locale);
    case "brand":
      return route.brand.name;
    case "brandCategory":
      return `${pickLocalized(route.category.name, locale)} ${route.brand.name}`;
    case "product":
      return pickLocalized(route.product.name, locale);
  }
}

/** Хлебные крошки (path без локали; локаль добавляет компонент ссылки). */
export function catalogBreadcrumbs(
  route: CatalogRoute,
  locale: Locale,
): { name: string; path: string }[] {
  const home = { name: locale === "uk" ? "Головна" : "Главная", path: "/" };
  switch (route.kind) {
    case "category":
      return [home, { name: pickLocalized(route.category.name, locale), path: `/${route.category.slug}` }];
    case "brand":
      return [home, { name: route.brand.name, path: `/${route.brand.slug}` }];
    case "brandCategory":
      return [
        home,
        { name: route.brand.name, path: `/${route.brand.slug}` },
        {
          name: pickLocalized(route.category.name, locale),
          path: `/${route.brand.slug}/${route.category.slug}`,
        },
      ];
    case "product":
      return [
        home,
        { name: route.brand.name, path: `/${route.brand.slug}` },
        {
          name: pickLocalized(route.category.name, locale),
          path: `/${route.brand.slug}/${route.category.slug}`,
        },
        {
          name: pickLocalized(route.product.name, locale),
          path: `/${route.product.brandSlug}/${route.product.categorySlug}/${route.product.slug}`,
        },
      ];
  }
}

/** UI-подписи каталога (чтобы не трогать i18n/messages). */
export const catalogUi = {
  from: { uk: "від", ru: "от" },
  uah: { uk: "грн", ru: "грн" },
  priceOnRequest: { uk: "Ціна за запитом", ru: "Цена по запросу" },
  specs: { uk: "Характеристики", ru: "Характеристики" },
  speed: { uk: "Швидкість", ru: "Скорость" },
  spin: { uk: "Обертання", ru: "Вращение" },
  arc: { uk: "Дуга", ru: "Дуга" },
  hardness: { uk: "Жорсткість губки", ru: "Жёсткость губки" },
  surface: { uk: "Тип поверхні", ru: "Тип поверхности" },
  level: { uk: "Рівень", ru: "Уровень" },
  colors: { uk: "Колір", ru: "Цвет" },
  thickness: { uk: "Товщина, мм", ru: "Толщина, мм" },
  emptySoon: { uk: "Товари скоро з'являться", ru: "Товары скоро появятся" },
  related: { uk: "Схожі товари", ru: "Похожие товары" },
  chooseInStep3: {
    uk: "Вибір варіанта та кошик — на наступному кроці",
    ru: "Выбор варианта и корзина — на следующем шаге",
  },
} satisfies Record<string, Localized>;
