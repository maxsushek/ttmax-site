// src/lib/checkout/shipping.ts
// Єдина формула вартості доставки. Використовується І на чекауті, І в /api/orders.

export type DeliveryMethod = "np" | "ukrposhta" | "pickup";

/**
 * ⚠️ ОДНА ФУНКЦІЯ НА ДВА БОКИ — і рахувати доставку деінде більше не можна.
 *
 * Було так: і CheckoutForm, і /api/orders рахували `subtotal >= threshold ? 0 : fee`,
 * жоден із них НЕ дивився на обраний спосіб. Наслідок бачив покупець у рахунку:
 *   • «Самовивіз · Безкоштовно» → у підсумку списувалось 90 грн за те, що людина
 *     приходить забрати сама;
 *   • «Укрпошта · ~30 грн» → списувалось ті самі 90 грн.
 * Це не помилка відображення: саме ця сума йшла в orders.shipping_uah і total_uah,
 * тобто в реальний рахунок. Такі розбіжності дають скарги й повернення з першим же
 * трафіком, і помічають їх покупці, а не ми.
 *
 * Тепер спосіб доставки — обов'язковий аргумент, тож «забути» його не вийде:
 * TypeScript не дасть викликати функцію без нього.
 *
 * ⚠️ Сервер МУСИТЬ рахувати сам і не довіряти totals.shipping із тіла запиту —
 * інакше клієнт зможе надіслати нуль.
 */
export function computeShipping(opts: {
  method: DeliveryMethod;
  subtotal: number;
  freeShippingThreshold: number;
  /** Тариф Нової Пошти, грн (site_settings → delivery_shipping_fee). */
  shippingFee: number;
  /** Тариф Укрпошти, грн (site_settings → delivery_ukrposhta_fee). */
  ukrposhtaFee: number;
}): number {
  const { method, subtotal, freeShippingThreshold, shippingFee, ukrposhtaFee } = opts;

  // Самовивіз нічого не коштує за визначенням: перевізник не задіяний.
  if (method === "pickup") return 0;

  // Безкоштовна доставка від порогу діє в обох перевізників однаково.
  if (subtotal >= freeShippingThreshold) return 0;

  // ⚠️ Тариф залежить від перевізника, і одного числа на двох не буває.
  // Укрпошта з 01.04.2026 рахує за об'ємом (Малий ≤8000 см³ — 80 грн), Нова Пошта
  // від 13.04.2026 бере фіксовані 90 грн за посилку до 2 кг. Наші відправлення —
  // накладки, основи, м'ячі — потрапляють саме в ці категорії.
  return method === "ukrposhta" ? ukrposhtaFee : shippingFee;
}
