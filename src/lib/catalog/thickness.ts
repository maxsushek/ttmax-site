// src/lib/catalog/thickness.ts
import type { Color } from "@/types/catalog";

type ThicknessVariant = { thickness: string; color: Color; price?: number; inStock?: boolean };

/** Вага товщини для сортування: OX (без губки) — найтонша, MAX — найтовща, решта — число в мм. */
function thicknessRank(th: string): number {
  const s = th.trim().toUpperCase();
  if (s === "OX") return 0;
  if (s === "MAX") return 100;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : -1;
}

/**
 * Товщина за замовчуванням — максимальна: більшість гравців бере саме її.
 * Якщо найтовщої немає в наявності чи без ціни для кольору за замовчуванням —
 * беремо наступну за товщиною доступну; якщо доступних немає — просто найтовщу.
 */
export function pickDefaultThickness(options: string[], variants: ThicknessVariant[], color: Color): string {
  if (options.length === 0) return "";
  const sorted = [...options].sort((a, b) => thicknessRank(b) - thicknessRank(a));
  const available = sorted.find((th) =>
    variants.some(
      (v) =>
        v.thickness === th &&
        v.color === color &&
        v.inStock !== false &&
        typeof v.price === "number" &&
        v.price > 0,
    ),
  );
  return available ?? sorted[0] ?? "";
}
