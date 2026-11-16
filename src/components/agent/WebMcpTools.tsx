"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import {
  currentProductLd,
  getModelContext,
  productDetailsTool,
  searchProductsTool,
} from "@/lib/webmcp/tools";

/**
 * Реєструє інструменти WebMCP для ШІ-агентів у браузері. Нічого не малює.
 * Що це, джерела й правила безпеки — у lib/webmcp/tools.ts.
 *
 * ⚠️ У браузерах без WebMCP (усі, крім Chrome 149+/Edge 150+ з origin trial або прапорцем)
 * ефект виходить на першому рядку: жодних запитів, жодного впливу на швидкість сторінки.
 */
export function WebMcpTools({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  // Пошук по каталогу — на всіх сторінках сайту.
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx) return;
    const ac = new AbortController();
    // Помилка реєстрації (API ще змінюється) не має ламати сторінку.
    Promise.resolve()
      .then(() => ctx.registerTool(searchProductsTool(locale), { signal: ac.signal }))
      .catch(() => {});
    return () => ac.abort();
  }, [locale]);

  // Дані товару — лише на картці (там, де є вузол Product саме цієї сторінки).
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx || !currentProductLd()) return;
    const ac = new AbortController();
    Promise.resolve()
      .then(() => ctx.registerTool(productDetailsTool(), { signal: ac.signal }))
      .catch(() => {});
    return () => ac.abort();
  }, [pathname]);

  return null;
}
