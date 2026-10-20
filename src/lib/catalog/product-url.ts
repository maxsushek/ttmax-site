// src/lib/catalog/product-url.ts
// Публічна адреса картки товару — для сповіщень менеджеру (Telegram), щоб із замовлення
// можна було одним дотиком відкрити, що саме купили.
//
// ⚠️ Slug приходить від клієнта (productId у кошику, productSlug у швидкому замовленні),
// тому адресу будуємо лише для товару, який реально є в каталозі: інакше в повідомлення
// могло б потрапити довільне посилання.
import { getProductBySlug } from "@/data/catalog";
import { siteConfig } from "@/config/site";

/** Повна адреса картки (/ua/…) або null, якщо такого товару в каталозі немає. */
export function productPageUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const p = getProductBySlug(slug);
  return p ? `${siteConfig.url}/ua/${p.brandSlug}/${p.categorySlug}/${p.slug}` : null;
}

/** Slug із productId кошика: "dignics-05__2.1__red" → "dignics-05". */
export const slugFromProductId = (productId: string): string => productId.split("__")[0] ?? "";
