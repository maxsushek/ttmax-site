// src/lib/catalog/racket.ts
// Збірна ракетка = основа + 2 накладки (slug-и у полі combo). Ціну рахуємо з компонентів
// (з урахуванням overrides з БД) і застосовуємо акційну знижку. Нічого не дублюємо.
import type { CatalogProduct } from "@/types/catalog";
import { getProductBySlug, getMinPrice } from "@/data/catalog";
import { applyOverrides, type OverridesMap } from "@/lib/catalog/overrides";

/** Акційна знижка на збірні ракетки (10%). */
export const RACKET_DISCOUNT = 0.1;

export type ComboInfo = {
  blade?: CatalogProduct;
  fh?: CatalogProduct;
  bh?: CatalogProduct;
  /** Реально знайдені компоненти у порядку [основа, FH, BH]. */
  parts: CatalogProduct[];
  /** Сума цін компонентів (стара ціна). undefined, якщо ціна якогось компонента невідома. */
  oldPrice?: number;
  /** Акційна ціна = oldPrice × (1 − знижка), округлена. */
  promoPrice?: number;
  /** Відсоток знижки (для бейджа). */
  discountPct: number;
};

export const isRacket = (p: CatalogProduct): boolean =>
  p.kind === "racket" || Boolean(p.combo);

/** Резолвить компоненти збірки (з overrides) і рахує стару/акційну ціну. */
export function resolveCombo(product: CatalogProduct, ov: OverridesMap): ComboInfo {
  const discountPct = Math.round(RACKET_DISCOUNT * 100);
  const c = product.combo;
  if (!c) return { parts: [], discountPct };

  const get = (slug?: string): CatalogProduct | undefined => {
    if (!slug) return undefined;
    const p = getProductBySlug(slug);
    return p ? applyOverrides(p, ov) : undefined;
  };

  const blade = get(c.blade);
  const fh = get(c.fh);
  const bh = get(c.bh);
  const parts = [blade, fh, bh].filter((p): p is CatalogProduct => Boolean(p));

  const prices = parts
    .map((p) => getMinPrice(p))
    .filter((n): n is number => typeof n === "number");

  const oldPrice =
    parts.length > 0 && prices.length === parts.length
      ? prices.reduce((a, b) => a + b, 0)
      : undefined;
  const promoPrice =
    oldPrice !== undefined ? Math.round(oldPrice * (1 - RACKET_DISCOUNT)) : undefined;

  return { blade, fh, bh, parts, oldPrice, promoPrice, discountPct };
}
