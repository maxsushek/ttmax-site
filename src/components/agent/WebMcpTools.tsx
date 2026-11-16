"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/analytics/events";
import {
  CONSULTATION_TOOL,
  EMPTY_PREFIX,
  ERROR_PREFIX,
  currentProductLd,
  getModelContext,
  productDetailsTool,
  searchProductsTool,
  type ModelContextTool,
} from "@/lib/webmcp/tools";

/**
 * Лічильник викликів: чи користуються інструментами взагалі (PostHog, подія webmcp_tool_call).
 * ⚠️ Передаємо лише назву інструмента й підсумок — без тексту запиту (див. правило 3 у tools.ts).
 */
function counted(tool: ModelContextTool): ModelContextTool {
  return {
    ...tool,
    execute: async (input, opts) => {
      let outcome: "ok" | "empty" | "error" = "error";
      try {
        const result = await tool.execute(input, opts);
        outcome = result.startsWith(ERROR_PREFIX)
          ? "error"
          : result.startsWith(EMPTY_PREFIX)
            ? "empty"
            : "ok";
        return result;
      } finally {
        trackEvent({ name: "webmcp_tool_call", params: { tool: tool.name, outcome } });
      }
    },
  };
}

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
      .then(() => ctx.registerTool(counted(searchProductsTool(locale)), { signal: ac.signal }))
      .catch(() => {});

    // Форма консультації — декларативний інструмент: свого execute в неї немає, тож рахуємо
    // подію браузера «агент заповнив поля». Фільтр за назвою — щоб не подвоїти виклики
    // скриптових інструментів, якщо Chrome шле цю подію і для них (у специфікації ще не вирішено).
    const onActivated = (e: Event) => {
      if ((e as Event & { toolName?: string }).toolName !== CONSULTATION_TOOL) return;
      trackEvent({
        name: "webmcp_tool_call",
        params: { tool: CONSULTATION_TOOL, outcome: "filled" },
      });
    };
    ctx.addEventListener?.("toolactivated", onActivated);

    return () => {
      ac.abort();
      ctx.removeEventListener?.("toolactivated", onActivated);
    };
  }, [locale]);

  // Дані товару — лише на картці (там, де є вузол Product саме цієї сторінки).
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx || !currentProductLd()) return;
    const ac = new AbortController();
    Promise.resolve()
      .then(() => ctx.registerTool(counted(productDetailsTool()), { signal: ac.signal }))
      .catch(() => {});
    return () => ac.abort();
  }, [pathname]);

  return null;
}
