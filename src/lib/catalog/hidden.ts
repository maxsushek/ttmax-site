// src/lib/catalog/hidden.ts
// ⏸️ ТИМЧАСОВЕ ПРИХОВУВАННЯ товарів без фото (за категоріями).
//
// НАВІЩО: у деяких категоріях багато карток без жодного фото (напр. одяг — 116 з 160).
// Картка без фото — тонка й погано конвертує, і в індексі така сторінка лише шкодить.
// Тому такі товари тимчасово ховаємо: з лістингу, з sitemap і ставимо noindex на картку.
//
// НІЧОГО НЕ ВИДАЛЯЄТЬСЯ. Це фільтр на рендері. ВІДНОВЛЕННЯ (два шляхи):
//   1) Залити фото товару в /admin → він З'ЯВИТЬСЯ САМ (умова «немає фото» перестане діяти).
//   2) Прибрати категорію з HIDE_PHOTOLESS_CATEGORIES або поставити HIDE_PHOTOLESS = false
//      → повернуться ВСІ одразу (навіть без фото).
//
// «Є фото» = існує рядок у Supabase entity_media для цього slug (pickPrimary != null).
import type { CatalogProduct } from "@/types/catalog";
import { pickPrimary, type EntityMediaMap } from "@/lib/media/get";

/** Головний вимикач. false → показуємо всі товари, як раніше. */
export const HIDE_PHOTOLESS = true;

/** Категорії, де ховаємо товари без фото. Додати slug → правило пошириться на категорію. */
export const HIDE_PHOTOLESS_CATEGORIES: ReadonlySet<string> = new Set(["odyag"]);

/** true → товар треба тимчасово сховати (потрапляє під правило й не має фото). */
export function isPhotolessHidden(product: CatalogProduct, media: EntityMediaMap): boolean {
  if (!HIDE_PHOTOLESS) return false;
  if (!HIDE_PHOTOLESS_CATEGORIES.has(product.categorySlug)) return false;
  return pickPrimary(media, "product", product.slug) == null;
}

/** Відсіює приховані товари зі списку (для лістингу). */
export function filterVisible(products: CatalogProduct[], media: EntityMediaMap): CatalogProduct[] {
  if (!HIDE_PHOTOLESS) return products;
  return products.filter((p) => !isPhotolessHidden(p, media));
}
