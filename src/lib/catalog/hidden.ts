// src/lib/catalog/hidden.ts
// ⏸️ ПРИХОВУВАННЯ ТОВАРІВ. Два НЕЗАЛЕЖНІ правила — не плутати, вони про різне:
//
//   1) WITHDRAWN_SLUGS — товар СВІДОМО знято з продажу власником (поіменно).
//   2) HIDE_PHOTOLESS  — тимчасово ховаємо картки без фото у визначених категоріях.
//
// НІЧОГО НЕ ВИДАЛЯЄТЬСЯ З КАТАЛОГУ. Обидва — фільтри на рендері, обидва оборотні.
import type { CatalogProduct } from "@/types/catalog";
import { pickPrimary, type EntityMediaMap } from "@/lib/media/get";

/* ---------------- 1. Знято з продажу (поіменно) ---------------- */

/**
 * Товари, які власник прибрав з асортименту. Прибрати slug зі списку → товар повернеться.
 *
 * ⚠️ ВІДРІЗНЯЄТЬСЯ ВІД HIDE_PHOTOLESS: там товар існує й продається, просто немає фото,
 * тому картка лишається доступною за прямим посиланням. Тут товару в продажу НЕМАЄ, тож
 * картка віддає 404 (page.tsx) — інакше на ній лишалась би робоча кнопка «В кошик»
 * і можна було б замовити те, чого магазин не продає.
 *
 * Знято 2026-07-29 на прохання власника (обидва — клеї без фото, які не завозяться):
 */
export const WITHDRAWN_SLUGS: ReadonlySet<string> = new Set([
  "klei-butterfly-free-chack-30-ml", // Free Chack 30 ml
  "klei-butterfly-freechack-pro-90ml", // Freechack PRO 90 ml
]);

/** true → товар знято з продажу власником. */
export function isWithdrawn(product: CatalogProduct): boolean {
  return WITHDRAWN_SLUGS.has(product.slug);
}

/* ---------------- 2. Тимчасово без фото ---------------- */

/**
 * НАВІЩО: у деяких категоріях багато карток без жодного фото (напр. одяг — 113 зі 160).
 * Картка без фото погано конвертує. Ховаємо: з лістингу, з sitemap, noindex на картці.
 * ВІДНОВЛЕННЯ: залити фото в /admin → товар з'явиться САМ (умова перестане діяти);
 * або прибрати категорію з HIDE_PHOTOLESS_CATEGORIES / поставити HIDE_PHOTOLESS = false.
 * «Є фото» = існує рядок у Supabase entity_media для цього slug (pickPrimary != null).
 */
export const HIDE_PHOTOLESS = true;

/**
 * Категорії, де ховаємо товари без фото. Додати slug → правило пошириться на категорію.
 *
 * myachi додано 01.08.2026 на прохання власника: 6 із 8 мʼячів уже мають фото, лишились
 * Easy Ball 40+ (120 шт) і Master Quality 40+ (72 шт). Правило САМОЛІКУВАЛЬНЕ — щойно
 * власник заллє їм фото, вони повернуться в лістинг і sitemap самі, без правки коду.
 */
export const HIDE_PHOTOLESS_CATEGORIES: ReadonlySet<string> = new Set(["odyag", "myachi"]);

/** true → товар треба тимчасово сховати (потрапляє під правило й не має фото). */
export function isPhotolessHidden(product: CatalogProduct, media: EntityMediaMap): boolean {
  if (!HIDE_PHOTOLESS) return false;
  if (!HIDE_PHOTOLESS_CATEGORIES.has(product.categorySlug)) return false;
  return pickPrimary(media, "product", product.slug) == null;
}

/* ---------------- Спільний предикат ---------------- */

/**
 * ЄДИНА перевірка «чи ховати товар» — саме її мають кликати всі місця (лістинг, крос-сел,
 * sitemap, robots картки). Тримати два виклики поруч не можна: варто десь забути один —
 * і знятий товар знову вилізе в сітку або в sitemap.
 */
export function isHidden(product: CatalogProduct, media: EntityMediaMap): boolean {
  return isWithdrawn(product) || isPhotolessHidden(product, media);
}

/** Відсіює приховані товари зі списку (лістинг, крос-сел). */
export function filterVisible(products: CatalogProduct[], media: EntityMediaMap): CatalogProduct[] {
  // ⚠️ Раннього виходу по HIDE_PHOTOLESS тут БУТИ НЕ МОЖЕ: вимикач стосується лише правила
  // «без фото», а знятий з продажу товар має зникати завжди.
  return products.filter((p) => !isHidden(p, media));
}
