// src/lib/telegram/bot.ts
// Низькорівневий виклик Bot API для двостороннього бота (модерація відгуків):
// sendMessage з кнопками, editMessageText, answerCallbackQuery.
// Сповіщення про замовлення живуть у notify.ts — той самий бот і чат (TELEGRAM_BOT_TOKEN,
// TELEGRAM_CHAT_ID). Ніколи не кидає: збій Telegram не повинен ламати сайт.

const TG_API = "https://api.telegram.org";

export type InlineButton = { text: string; callback_data?: string; url?: string };
export type InlineKeyboard = { inline_keyboard: InlineButton[][] };

export function botChatId(): string | null {
  return process.env.TELEGRAM_CHAT_ID || null;
}

export function isBotConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Виклик методу Bot API. Повертає result або null. */
export async function tg<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${TG_API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
    if (!res.ok || !json?.ok) {
      // «message is not modified» — не помилка: користувач натиснув ту саму кнопку двічі.
      if (!json?.description?.includes("message is not modified")) {
        console.error(`[telegram] ${method} failed:`, res.status, json?.description ?? "");
      }
      return null;
    }
    return (json.result ?? null) as T | null;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Екранування під parse_mode=HTML. */
export const tgEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const tgEscAttr = (s: string) => tgEsc(s).replace(/"/g, "&quot;");

/** «21.10 14:05» за Києвом — щоб модератор бачив звичний час, а не UTC. */
export function kyivTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("day")}.${g("month")} ${g("hour")}:${g("minute")}`;
}
