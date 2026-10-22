// src/lib/reviews/moderation.ts
// Модерація відгуків: повідомлення в Telegram з кнопками, зміна статусу, відповідь
// магазину, скидання кешу сторінок. Викликається з /api/reviews (новий відгук),
// /api/telegram/webhook (кнопки й reply) і з адмінки.
import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReviewRow, ReviewStatus } from "@/lib/supabase/types";
import { getProductBySlug } from "@/data/catalog";
import { productPageUrl } from "@/lib/catalog/product-url";
import { siteConfig } from "@/config/site";
import { botChatId, kyivTime, tg, tgEsc, tgEscAttr, type InlineKeyboard } from "@/lib/telegram/bot";
import { LATEST_REVIEWS_TAG, STORE_REVIEWS_TAG, productReviewsTag } from "./data";

type Sb = SupabaseClient<Database>;

export type ModerationAction = "approve" | "reject" | "spam" | "pending";

const ACTION_TO_STATUS: Record<ModerationAction, ReviewStatus> = {
  approve: "approved",
  reject: "rejected",
  spam: "spam",
  pending: "pending",
};

/** Короткі коди для callback_data (ліміт Telegram — 64 байти). */
export const ACTION_CODE: Record<ModerationAction, string> = { approve: "a", reject: "r", spam: "s", pending: "p" };
export const CODE_ACTION: Record<string, ModerationAction> = { a: "approve", r: "reject", s: "spam", p: "pending" };

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Назва й адреса товару для повідомлення (або магазин). */
export function reviewSubject(r: Pick<ReviewRow, "kind" | "product_slug">): { name: string; url: string | null } {
  if (r.kind === "store" || !r.product_slug) {
    return { name: "Магазин TTMAX", url: `${siteConfig.url}/ua/vidguky` };
  }
  const p = getProductBySlug(r.product_slug);
  return { name: p ? p.name.ua : r.product_slug, url: productPageUrl(r.product_slug) };
}

const STATUS_LINE: Record<ReviewStatus, string> = {
  pending: "⏳ <b>На модерації</b>",
  approved: "✅ <b>Опубліковано</b>",
  rejected: "❌ <b>Відхилено</b>",
  spam: "🚫 <b>Спам</b>",
};

export function reviewMessageText(r: ReviewRow): string {
  const subject = reviewSubject(r);
  const title = subject.url ? `<a href="${tgEscAttr(subject.url)}">${tgEsc(subject.name)}</a>` : tgEsc(subject.name);
  const lines: string[] = [
    `${stars(r.rating)} <b>${r.rating}/5</b> · ${r.kind === "store" ? "відгук про магазин" : "відгук про товар"}`,
    `${r.kind === "store" ? "🏪" : "🛒"} ${title}`,
    `👤 ${tgEsc(r.author_name)}${r.author_city ? `, ${tgEsc(r.author_city)}` : ""}`,
  ];
  if (r.verified && r.order_number) {
    const ref = r.order_number.startsWith("L-")
      ? "швидке замовлення (заявка в CRM)"
      : r.order_number.startsWith("Z-")
        ? `швидке замовлення ${tgEsc(r.order_number)}`
        : `замовлення ${tgEsc(r.order_number)}`;
    lines.push(`✅ Покупець — ${ref}${r.source === "invite" ? " (за посиланням)" : ""}`);
  } else if (r.phone) {
    lines.push(`📞 +${tgEsc(r.phone)} — замовлень ${r.kind === "store" ? "" : "цього товару "}не знайдено`);
  } else {
    lines.push("📞 Телефон не вказано");
  }
  lines.push("", `💬 ${tgEsc(clip(r.body, 1500))}`);
  if (r.flags.length) lines.push("", `⚠️ Підозра: ${tgEsc(r.flags.join(", "))}`);
  lines.push("", `🌐 ${r.locale === "ru" ? "ru" : "ua"} · ${kyivTime(r.created_at)}`);
  lines.push(
    "",
    `${STATUS_LINE[r.status]}${r.moderated_by && r.status !== "pending" ? ` — ${tgEsc(r.moderated_by)}${r.moderated_at ? `, ${kyivTime(r.moderated_at)}` : ""}` : ""}`,
  );
  if (r.reply_body) lines.push("", `🗨 <b>Відповідь магазину:</b> ${tgEsc(clip(r.reply_body, 800))}`);
  if (r.status !== "spam" && r.status !== "rejected") {
    lines.push("", "<i>Щоб відповісти від імені магазину — Reply на це повідомлення. «-» прибирає відповідь.</i>");
  }
  return lines.join("\n");
}

export function reviewKeyboard(r: Pick<ReviewRow, "id" | "status">): InlineKeyboard {
  const cb = (a: ModerationAction) => `rv:${ACTION_CODE[a]}:${r.id}`;
  switch (r.status) {
    case "pending":
      return {
        inline_keyboard: [
          [
            { text: "✅ Опублікувати", callback_data: cb("approve") },
            { text: "❌ Відхилити", callback_data: cb("reject") },
          ],
          [{ text: "🚫 Спам", callback_data: cb("spam") }],
        ],
      };
    case "approved":
      return { inline_keyboard: [[{ text: "🙈 Зняти з публікації", callback_data: cb("reject") }]] };
    default:
      return { inline_keyboard: [[{ text: "↩️ Повернути на модерацію", callback_data: cb("pending") }]] };
  }
}

/** Скинути кеш сторінок, де цей відгук показується (або перестає показуватись). */
export function revalidateReview(r: Pick<ReviewRow, "kind" | "product_slug">): void {
  if (r.kind === "product" && r.product_slug) {
    revalidateTag(productReviewsTag(r.product_slug));
    revalidateTag(LATEST_REVIEWS_TAG);
  } else {
    revalidateTag(STORE_REVIEWS_TAG);
  }
}

/** Надіслати новий відгук у Telegram і запамʼятати повідомлення (для кнопок і reply). */
export async function sendForModeration(sb: Sb, r: ReviewRow): Promise<void> {
  const chatId = botChatId();
  if (!chatId) return;
  const msg = await tg<{ message_id: number; chat: { id: number } }>("sendMessage", {
    chat_id: chatId,
    text: reviewMessageText(r),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: reviewKeyboard(r),
  });
  if (msg) {
    await sb.from("reviews").update({ tg_chat_id: msg.chat.id, tg_message_id: msg.message_id }).eq("id", r.id);
  }
}

/** Перемалювати повідомлення в Telegram після зміни (статус, відповідь). */
export async function refreshMessage(r: ReviewRow): Promise<void> {
  if (!r.tg_chat_id || !r.tg_message_id) return;
  await tg("editMessageText", {
    chat_id: r.tg_chat_id,
    message_id: r.tg_message_id,
    text: reviewMessageText(r),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: reviewKeyboard(r),
  });
}

/** Змінити статус. Повертає оновлений рядок або null. */
export async function applyModeration(
  sb: Sb,
  id: string,
  action: ModerationAction,
  by: string,
): Promise<ReviewRow | null> {
  const status = ACTION_TO_STATUS[action];
  const { data, error } = await sb
    .from("reviews")
    .update({
      status,
      moderated_at: status === "pending" ? null : new Date().toISOString(),
      moderated_by: status === "pending" ? null : by.slice(0, 80),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    console.error("[reviews] moderation failed:", error?.message ?? "not found");
    return null;
  }
  const row = data as ReviewRow;
  revalidateReview(row);
  return row;
}

/** Відповідь магазину (null — прибрати). */
export async function applyReply(sb: Sb, id: string, text: string | null): Promise<ReviewRow | null> {
  const body = text?.trim() ? text.trim().slice(0, 3000) : null;
  const { data, error } = await sb
    .from("reviews")
    .update({ reply_body: body, reply_at: body ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  const row = data as ReviewRow;
  if (row.status === "approved") revalidateReview(row);
  return row;
}
