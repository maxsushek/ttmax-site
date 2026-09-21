// src/data/catalog/promos.ts
// Акції: «стара» ціна для закресленого показу. Саму акційну ціну ставимо в адмінці
// (product_overrides) — тут лише число, від якого рахується знижка.
//
// ⚠️ Закреслена ціна мусить бути СПРАВЖНЬОЮ попередньою ціною на сайті — інакше це
// вигадана знижка (і для покупця, і для Google). Dignics коштували 4 100 грн з 01.06.2026
// (product_overrides.updated_at), до акції 21.09.2026.
//
// ⚠️ Показ самозахищений: закреслення зʼявляється, лише поки поточна ціна НИЖЧА за стару.
// Повернули в адмінці 4 100 — акція зникне сама, код правити не треба. Але щоб прибрати
// й цей запис, видаліть рядок нижче в наступному деплої.

const PROMO_OLD_PRICE: Record<string, number> = {
  // Акція на серію Dignics: 4 100 → 3 950 (−150 грн). Розпочато 2026-09-21.
  "dignics-05": 4100,
  "dignics-09c": 4100,
  "dignics-64": 4100,
  "dignics-80": 4100,
};

/** Стара ціна для закреслення або undefined, якщо акції немає чи поточна ціна не нижча. */
export function promoOldPrice(slug: string, currentPrice: number | undefined): number | undefined {
  const old = PROMO_OLD_PRICE[slug];
  if (old === undefined || typeof currentPrice !== "number" || currentPrice <= 0) return undefined;
  return old > currentPrice ? old : undefined;
}
