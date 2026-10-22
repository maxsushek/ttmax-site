// src/lib/crm/status.ts
// Статуси заявок (CRM) і замовлень: підписи для Telegram, короткі коди для кнопок
// (callback_data ≤ 64 байти) і відповідність «замовлення ↔ його копія в CRM».
import type { LeadStatus, OrderStatus } from "@/lib/supabase/types";

/** Ті самі етапи, що в CRM (inline-status.tsx), — українською, як решта бота. */
export const LEAD_STATUS: Record<LeadStatus, { label: string; icon: string; code: string }> = {
  new: { label: "Новий", icon: "🆕", code: "n" },
  contacted: { label: "Звʼязались", icon: "📞", code: "c" },
  qualified: { label: "Цільовий", icon: "🎯", code: "q" },
  unqualified: { label: "Не наш", icon: "🚫", code: "u" },
  in_progress: { label: "Замовив", icon: "🛒", code: "i" },
  won: { label: "Викупив", icon: "✅", code: "w" },
  lost: { label: "Не викупив", icon: "❌", code: "l" },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; icon: string; code: string }> = {
  pending: { label: "Нове", icon: "⏳", code: "p" },
  processing: { label: "В роботі", icon: "🔄", code: "r" },
  paid: { label: "Оплачено", icon: "💳", code: "y" },
  shipped: { label: "Відправлено", icon: "📦", code: "s" },
  delivered: { label: "Доставлено", icon: "✅", code: "d" },
  cancelled: { label: "Скасовано", icon: "❌", code: "x" },
  refunded: { label: "Повернення", icon: "↩️", code: "f" },
};

const invert = <T extends string>(m: Record<T, { code: string }>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [(v as { code: string }).code, k])) as Record<string, T>;

export const LEAD_BY_CODE = invert<LeadStatus>(LEAD_STATUS);
export const ORDER_BY_CODE = invert<OrderStatus>(ORDER_STATUS);

/** Статус копії замовлення в CRM за статусом самого замовлення. */
export const ORDER_TO_LEAD: Record<OrderStatus, LeadStatus> = {
  pending: "new",
  processing: "in_progress",
  paid: "in_progress",
  shipped: "in_progress",
  delivered: "won",
  cancelled: "lost",
  refunded: "lost",
};

/**
 * Зворотний напрям — коли статус копії замовлення міняють у CRM. Повертає null, якщо
 * поточний статус замовлення вже відповідає етапу (напр. «Відправлено» і в CRM «Замовив»):
 * детальніший статус замовлення не можна затирати грубішим.
 */
export function leadToOrder(lead: LeadStatus, current: OrderStatus): OrderStatus | null {
  if (ORDER_TO_LEAD[current] === lead) return null;
  switch (lead) {
    case "new":
      return "pending";
    case "contacted":
    case "qualified":
    case "in_progress":
      return "processing";
    case "won":
      return "delivered";
    case "lost":
    case "unqualified":
      return "cancelled";
  }
}
