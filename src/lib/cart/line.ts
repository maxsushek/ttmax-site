// src/lib/cart/line.ts
// Рядок кошика: назва «модель · варіант» і адреса картки товару.
//
// ⚠️ НАВІЩО (23.11.2026, аудит PostHog за 22.10–23.11).
// 1) На телефоні кошик обрізав назву до «Футболка Abiko · Розмір …» — розміру не було видно
//    ні в кошику, ні на кроці підтвердження. Разом із розміром XS, вибраним наперед, це дало
//    8 із 9 рядків XS, покладених у кошик без вибору (2 з 11 замовлень містять XS). Тому
//    варіант (розмір, ручка, товщина й колір) тепер показуємо ОКРЕМИМ рядком і не обрізаємо.
// 2) 53 «мертві» кліки по фото й назві в кошику (18 із 55 сесій із кошиком): люди очікують,
//    що рядок відкриє картку товару. Тепер це посилання.
//
// Назву позиції (`model`) свідомо лишаємо одним рядком «модель · варіант»: саме її бачить
// менеджер у Telegram і CRM, вона ж іде в order_items і в аналітику. Тут — лише складання
// й розбирання цього рядка в одному місці, щоб панелі покупки й кошик не розійшлись у форматі.
import type { CartItem, ProductCategory } from "@/types";

/** Роздільник між моделлю й варіантом. У назвах моделей каталогу його немає (перевірено 23.11.2026). */
export const CART_VARIANT_SEP = " · ";

/** Назва позиції для кошика й замовлення: «Tenergy 05 · 2.1 мм · Чорна». */
export function cartModel(model: string, variant?: string | null): string {
  return variant ? `${model}${CART_VARIANT_SEP}${variant}` : model;
}

/** Назва позиції → модель і варіант (для показу окремими рядками). */
export function splitCartModel(full: string): { name: string; variant: string | null } {
  const i = full.indexOf(CART_VARIANT_SEP);
  if (i === -1) return { name: full, variant: null };
  return { name: full.slice(0, i), variant: full.slice(i + CART_VARIANT_SEP.length) };
}

/**
 * Розділ каталогу за категорією кошика — лише для позицій, покладених у кошик ДО появи
 * поля `href` 24.11.2026 (кошик живе в localStorage днями; після січня 2027 цю мапу можна прибрати). Це обернена мапа до CART_CATEGORY у
 * [...segments]/page.tsx; усі товари каталогу — бренду butterfly.
 *
 * «base» мають і основи, і збірні ракетки. Розрізняємо за id: у основи він завжди з ручкою
 * («viscaria__fl»), у ракетки — голий slug. Стіл (єдина категорія поза мапою) у кошик не
 * потрапляє: в нього «ціна за запитом».
 */
const LEGACY_SECTION: Record<ProductCategory, string> = {
  rubber: "nakladki",
  base: "osnovaniya",
  ball: "myachi",
  apparel: "odyag",
  shoes: "obuv",
  accessory: "aksessuary",
  bag: "chehly",
  net: "setki",
};

/** Шлях картки товару без локалі («/butterfly/odyag/futbolka-…») або null, якщо зібрати не вдалось. */
export function cartItemPath(item: Pick<CartItem, "id" | "category" | "href">): string | null {
  // href із localStorage: приймаємо лише внутрішній шлях.
  if (typeof item.href === "string" && /^\/[a-z0-9]/.test(item.href)) return item.href;
  const [slug] = item.id.split("__");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  const section =
    item.category === "base" && !item.id.includes("__") ? "rakety" : LEGACY_SECTION[item.category];
  return section ? `/butterfly/${section}/${slug}` : null;
}
