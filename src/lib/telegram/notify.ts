// src/lib/telegram/notify.ts
// Сповіщення про нові замовлення в Telegram через Bot API.
// Вмикається змінними оточення TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
// Якщо їх немає — функції тихо нічого не роблять (no-op), як і решта інтеграцій.
// Ніколи не кидає виключення: помилка лише логується, щоб не валити оформлення замовлення.

const TG_API = "https://api.telegram.org";

type DeliveryMethod = "np" | "ukrposhta" | "pickup";
type PaymentMethod = "apple" | "cod" | "card";

export type NewOrderNotification = {
  orderNumber: string | number;
  name: string;
  phone: string;
  email?: string | null;
  items: { brand: string; model: string; qty: number; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: { method: DeliveryMethod; city?: string | null; branch?: string | null };
  payment: { method: PaymentMethod };
  comment?: string | null;
  locale: string;
  /** Посилання на CRM (будується з домену запиту). */
  adminUrl?: string | null;
};

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  np: "Нова Пошта",
  ukrposhta: "Укрпошта",
  pickup: "Самовивіз",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  apple: "Apple Pay",
  cod: "Накладений платіж",
  card: "Картка",
};

/** Чи задані змінні оточення для Telegram. */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Екранування під parse_mode=HTML (щоб дані клієнта не ламали розмітку). */
function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** "12 500 ₴" — грошова сума без залежності від Intl/ICU. */
function uah(n: number): string {
  const grouped = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} ₴`;
}

/** Низькорівнева відправка повідомлення. Повертає true при успіху. */
async function sendMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[telegram] sendMessage failed:", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram] sendMessage error:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Збирає й відправляє повідомлення про нове замовлення. Безпечно за будь-яких умов. */
export async function notifyNewOrder(order: NewOrderNotification): Promise<boolean> {
  if (!isTelegramConfigured()) return false;

  const deliveryExtra = [order.delivery.city, order.delivery.branch]
    .filter(Boolean)
    .map((s) => esc(String(s)))
    .join(", ");

  const lines: string[] = [
    `🆕 <b>Нове замовлення ${esc(String(order.orderNumber))}</b>`,
    "",
    `👤 ${esc(order.name)}`,
    `📞 ${esc(order.phone)}`,
  ];
  if (order.email) lines.push(`✉️ ${esc(order.email)}`);

  lines.push("", "🛒 <b>Товари:</b>");
  for (const it of order.items) {
    lines.push(`• ${esc(it.brand)} ${esc(it.model)} ×${it.qty} — ${uah(it.lineTotal)}`);
  }

  lines.push(
    "",
    `📦 Доставка: ${DELIVERY_LABELS[order.delivery.method]}${
      deliveryExtra ? ` — ${deliveryExtra}` : ""
    } (${uah(order.shipping)})`,
    `💳 Оплата: ${PAYMENT_LABELS[order.payment.method]}`,
  );
  if (order.comment) lines.push(`📝 ${esc(order.comment)}`);

  lines.push(
    "",
    `💰 Разом: <b>${uah(order.total)}</b> (товари ${uah(order.subtotal)})`,
    `🌐 ${esc(order.locale)}`,
  );
  if (order.adminUrl) lines.push("", `<a href="${order.adminUrl}">Відкрити в CRM →</a>`);

  return sendMessage(lines.join("\n"));
}
