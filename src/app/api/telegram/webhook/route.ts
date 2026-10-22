// POST /api/telegram/webhook — сюди Telegram надсилає натискання кнопок і повідомлення.
//
// Безпека:
//  • заголовок X-Telegram-Bot-Api-Secret-Token мусить збігтися з секретом (lib/reviews/secret);
//  • дії приймаються ЛИШЕ з робочого чату (TELEGRAM_CHAT_ID) — бот у чужому чаті нічого не змінить.
//
// Що вміє:
//  • кнопки під відгуком: опублікувати / відхилити / спам / повернути на модерацію;
//  • Reply на повідомлення з відгуком → відповідь магазину на сайті («-» — прибрати);
//  • кнопка «⭐ Посилання на відгук» під замовленням і команда /link TT-… → персональне посилання.
//
// Завжди відповідаємо 200: інакше Telegram повторює той самий апдейт.
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkTelegramSecret, inviteUrl, INVITE_DAYS } from "@/lib/reviews/secret";
import { CODE_ACTION, applyModeration, applyReply, refreshMessage } from "@/lib/reviews/moderation";
import { findInviteRef, findLatestByPhone, normalizePhone } from "@/lib/reviews/purchase";
import { getProductBySlug } from "@/data/catalog";
import { botChatId, tg, tgEsc } from "@/lib/telegram/bot";
import type { ReviewRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TgUser = { id: number; first_name?: string; last_name?: string; username?: string };
type TgMessage = {
  message_id: number;
  chat: { id: number };
  from?: TgUser;
  text?: string;
  reply_to_message?: { message_id: number };
};
type TgUpdate = {
  callback_query?: { id: string; from: TgUser; data?: string; message?: TgMessage };
  message?: TgMessage;
};

const ok = () => NextResponse.json({ ok: true });
const who = (u?: TgUser) => (u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || String(u.id) : "telegram");
const isWorkChat = (chatId: number | undefined) => {
  const allowed = botChatId();
  return Boolean(allowed && chatId !== undefined && String(chatId) === String(allowed));
};

/** ref — номер замовлення (TT-…), заявка (L-uuid) або телефон (380…). */
async function sendInvite(chatId: number, ref: string, replyTo?: number): Promise<void> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  const order = !sb ? null : /^380\d{9}$/.test(ref) ? await findLatestByPhone(sb, ref) : await findInviteRef(sb, ref);
  if (!order) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: /^380/.test(ref)
        ? `За номером +${tgEsc(ref)} немає замовлень чи швидких замовлень із товаром.`
        : `${ref.startsWith("L-") ? "Заявку" : "Замовлення"} ${tgEsc(ref)} не знайдено (або скасоване / без товару).`,
      reply_to_message_id: replyTo,
    });
    return;
  }
  const url = inviteUrl(order.orderNumber, order.locale);
  if (!url) return;
  const ru = order.locale === "ru";
  const forClient = ru
    ? `Спасибо за покупку в TTMAX! Будем благодарны за отзыв о товаре — это займёт минуту: ${url}`
    : `Дякуємо за покупку в TTMAX! Будемо вдячні за відгук про товар — це хвилина часу: ${url}`;
  await tg("sendMessage", {
    chat_id: chatId,
    reply_to_message_id: replyTo,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    text: [
      `⭐ <b>Посилання на відгук — ${
        order.orderNumber.startsWith("L-")
          ? `швидке замовлення: ${tgEsc(order.slugs.map((s) => getProductBySlug(s)?.name.ua ?? s).join(", "))}`
          : tgEsc(order.orderNumber)
      }</b>`,
      `Діє ${INVITE_DAYS} днів. Відгуки за ним одразу позначаються «Покупець».`,
      "",
      "Текст для клієнта (Viber / Telegram / SMS) — натисніть, щоб скопіювати:",
      `<code>${tgEsc(forClient)}</code>`,
    ].join("\n"),
  });
}

export async function POST(request: NextRequest) {
  if (!checkTelegramSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return ok();
  }

  /* ---------- Кнопки ---------- */
  const cq = update.callback_query;
  if (cq) {
    const chatId = cq.message?.chat.id;
    if (!isWorkChat(chatId)) {
      await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Недоступно" });
      return ok();
    }
    const data = cq.data ?? "";

    // Посилання на відгук із повідомлення про замовлення.
    const inv = /^inv:(TT-\d{8}-\d{3,}|L-[0-9a-f-]{36})$/.exec(data);
    if (inv?.[1] && chatId !== undefined) {
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      await sendInvite(chatId, inv[1], cq.message?.message_id);
      return ok();
    }

    const m = /^rv:([arsp]):([0-9a-f-]{36})$/.exec(data);
    const action = m?.[1] ? CODE_ACTION[m[1]] : undefined;
    if (!m?.[2] || !action) {
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      return ok();
    }
    const sb = getSupabaseServerClient({ useServiceRole: true });
    const row = sb ? await applyModeration(sb, m[2], action, who(cq.from)) : null;
    if (row) await refreshMessage(row);
    const toast: Record<string, string> = {
      approve: "Опубліковано на сайті",
      reject: "Відхилено",
      spam: "Позначено як спам",
      pending: "Повернуто на модерацію",
    };
    await tg("answerCallbackQuery", {
      callback_query_id: cq.id,
      text: row ? toast[action] : "Не вдалося — спробуйте ще раз",
    });
    return ok();
  }

  /* ---------- Повідомлення ---------- */
  const msg = update.message;
  if (!msg || !isWorkChat(msg.chat.id) || !msg.text) return ok();
  const text = msg.text.trim();

  // /link TT-20261020-00011 або /link 0671234567 — посилання для старих замовлень і
  // швидких замовлень / консультацій (за телефоном — останній продаж цьому клієнту).
  const link = /^\/(?:link|vidguk)(?:@\w+)?\s+(.+)$/i.exec(text);
  if (link?.[1]) {
    const arg = link[1].trim();
    const num = /TT-\d{8}-\d{3,}/i.exec(arg)?.[0]?.toUpperCase();
    const phone = num ? null : normalizePhone(arg);
    if (num || phone) {
      await sendInvite(msg.chat.id, (num ?? phone)!, msg.message_id);
    } else {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        reply_to_message_id: msg.message_id,
        text: "Формат: /link TT-20261020-00016 або /link 067 123 45 67",
      });
    }
    return ok();
  }

  // Reply на повідомлення з відгуком → відповідь магазину.
  if (msg.reply_to_message) {
    const sb = getSupabaseServerClient({ useServiceRole: true });
    if (!sb) return ok();
    const { data } = await sb
      .from("reviews")
      .select("id")
      .eq("tg_chat_id", msg.chat.id)
      .eq("tg_message_id", msg.reply_to_message.message_id)
      .maybeSingle();
    if (!data) return ok(); // reply на щось інше — не наша справа
    const remove = text === "-" || text === "—";
    const row = await applyReply(sb, (data as { id: string }).id, remove ? null : text);
    if (row) await refreshMessage(row as ReviewRow);
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      reply_to_message_id: msg.message_id,
      text: !row
        ? "Не вдалося зберегти відповідь."
        : remove
          ? "🗑 Відповідь прибрано."
          : row.status === "approved"
            ? "💬 Відповідь опубліковано під відгуком."
            : "💬 Відповідь збережено — зʼявиться на сайті разом із відгуком після публікації.",
    });
  }
  return ok();
}
