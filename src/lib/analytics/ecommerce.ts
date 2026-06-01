// Хелпери для ecommerce-подій: перетворення позицій кошика у формат AnalyticsItem.
import type { AnalyticsItem } from "./types";

export const CURRENCY = "UAH";

type CartLineLike = { id: string; brand: string; model: string; price: number; qty: number };

export function toAnalyticsItems(lines: readonly CartLineLike[]): AnalyticsItem[] {
  return lines.map((l) => ({
    id: l.id,
    name: l.model,
    brand: l.brand,
    price: l.price,
    quantity: l.qty,
  }));
}

export function linesValue(lines: readonly CartLineLike[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}
