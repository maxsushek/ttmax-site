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
import { findInviteRef, findLatestByPhone, normalizePhone, type OrderInfo } from "@/lib/reviews/purchase";
import { INVITE_VARIANTS, firstName, inviteCopy, type CopyLang } from "@/lib/reviews/invite-copy";
import { getProductBySlug } from "@/data/catalog";
import { botChatId, tg, tgEsc, type InlineKeyboard } from "@/lib/telegram/bot";
import { setLeadStatus, setOrderStatus } from "@/lib/telegram/crm";
import { sendLeadCard, sendOrderCard } from "@/lib/telegram/cards";
import { LEAD_BY_CODE, LEAD_STATUS, ORDER_BY_CODE, ORDER_STATUS } from "@/lib/crm/status";
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

/** Повідомлення-запрошення для менеджера: готовий текст для клієнта + кнопки варіантів і мови. */
function buildInvite(order: OrderInfo, variant: number, lang: CopyLang): { text: string; reply_markup: InlineKeyboard } | null {
  const url = inviteUrl(order.orderNumber, lang);
  if (!url) return null;
  const products = order.slugs.map((s) => getProductBySlug(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const copy = inviteCopy({ lang, name: order.customerName, products, url, variant });
  const v = ((variant % INVITE_VARIANTS) + INVITE_VARIANTS) % INVITE_VARIANTS;
  const isLead = /^(L|Z)-/.test(order.orderNumber);
  const who = firstName(order.customerName);
  const l = lang === "ru" ? "r" : "u";
  const text = [
    `⭐ <b>Запрошення на відгук — ${
      isLead ? `швидке замовлення${order.orderNumber.startsWith("Z-") ? ` ${tgEsc(order.orderNumber)}` : ""}` : tgEsc(order.orderNumber)
    }</b>`,
    `${who ? `👤 ${tgEsc(who)} · ` : ""}🛒 ${tgEsc(products.map((p) => p.name.ua).join(", ") || "—")}`,
    `${lang === "ru" ? "🇷🇺 російською" : "🇺🇦 українською"} · варіант ${v + 1} з ${INVITE_VARIANTS} · посилання діє ${INVITE_DAYS} днів, відгуки за ним — «Покупець»`,
    "",
    "<b>Повідомлення</b> для Viber / Telegram — торкніться блоку, щоб скопіювати:",
    `<pre>${tgEsc(copy.full)}</pre>`,
    "",
    "<b>Коротко</b> для SMS:",
    `<pre>${tgEsc(copy.short)}</pre>`,
  ].join("\n");
  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔄 Інший варіант", callback_data: `inx:${(v + 1) % INVITE_VARIANTS}:${l}:${order.orderNumber}` },
          {
            text: lang === "ru" ? "🇺🇦 Українською" : "🇷🇺 Російською",
            callback_data: `inx:${v}:${l === "u" ? "r" : "u"}:${order.orderNumber}`,
          },
        ],
      ],
    },
  };
}

/** Стартовий варіант — від номера: різні клієнти отримують різні тексти, той самий — той самий. */
const variantFor = (ref: string) => [...ref].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % INVITE_VARIANTS;

/** ref — номер замовлення (TT-…), заявка (L-uuid) або телефон (380…). */
async function sendInvite(chatId: number, ref: string, replyTo?: number): Promise<void> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  const order = !sb ? null : /^380\d{9}$/.test(ref) ? await findLatestByPhone(sb, ref) : await findInviteRef(sb, ref);
  if (!order) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: /^380/.test(ref)
        ? `За номером +${tgEsc(ref)} немає замовлень чи швидких замовлень із товаром.`
        : `${/^(L|Z)-/.test(ref) ? "Заявку" : "Замовлення"} ${tgEsc(ref)} не знайдено (або закрита / без товару).`,
      reply_to_message_id: replyTo,
    });
    return;
  }
  const built = buildInvite(order, variantFor(order.orderNumber), order.locale === "ru" ? "ru" : "uk");
  if (!built) return;
  await tg("sendMessage", {
    chat_id: chatId,
    reply_to_message_id: replyTo,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...built,
  });
}

/** /status TT-… | Z-… — свіжа картка з кнопками; вона й стає «живою» (її перемальовує зміна статусу). */
async function sendStatusCard(chatId: number, num: string, replyTo?: number): Promise<void> {
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return;
  let ok = false;
  if (num.startsWith("TT-")) {
    const { data } = await sb.from("orders").select("id").eq("order_number", num).maybeSingle();
    if (data) ok = await sendOrderCard(sb, (data as { id: string }).id, replyTo);
  } else {
    const { data } = await sb.from("leads").select("id").eq("lead_number", num).maybeSingle();
    if (data) ok = await sendLeadCard(sb, (data as { id: string }).id, replyTo);
  }
  if (!ok) {
    await tg("sendMessage", { chat_id: chatId, reply_to_message_id: replyTo, text: `${num} не знайдено.` });
  }
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

    if (data === "noop") {
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      return ok();
    }

    // Статус заявки (як у CRM) / статус замовлення — кнопки лишаються й перемальовуються.
    const st = /^(ls|os):([a-z]):([0-9a-f-]{36})$/.exec(data);
    if (st?.[1] && st[2] && st[3]) {
      const sb = getSupabaseServerClient({ useServiceRole: true });
      const by = `${who(cq.from)} (Telegram)`;
      let done = false;
      let label = "";
      if (sb && st[1] === "ls" && LEAD_BY_CODE[st[2]]) {
        const s = LEAD_BY_CODE[st[2]]!;
        done = await setLeadStatus(sb, st[3], s, by);
        label = LEAD_STATUS[s].label;
      } else if (sb && st[1] === "os" && ORDER_BY_CODE[st[2]]) {
        const s = ORDER_BY_CODE[st[2]]!;
        done = await setOrderStatus(sb, st[3], s, by);
        label = ORDER_STATUS[s].label;
      }
      await tg("answerCallbackQuery", { callback_query_id: cq.id, text: done ? `Статус: ${label}` : "Не вдалося змінити статус" });
      return ok();
    }

    // Посилання на відгук із повідомлення про замовлення.
    const inv = /^inv:(TT-\d{8}-\d{3,}|Z-\d{8}-\d{3,}|L-[0-9a-f-]{36})$/.exec(data);
    if (inv?.[1] && chatId !== undefined) {
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      await sendInvite(chatId, inv[1], cq.message?.message_id);
      return ok();
    }

    // Інший варіант тексту / інша мова — перемальовуємо те саме повідомлення.
    const inx = /^inx:(\d):([ur]):(TT-\d{8}-\d{3,}|Z-\d{8}-\d{3,}|L-[0-9a-f-]{36})$/.exec(data);
    if (inx?.[3] && cq.message) {
      const sb = getSupabaseServerClient({ useServiceRole: true });
      const order = sb ? await findInviteRef(sb, inx[3]) : null;
      const built = order ? buildInvite(order, Number(inx[1]), inx[2] === "r" ? "ru" : "uk") : null;
      if (built) {
        await tg("editMessageText", {
          chat_id: cq.message.chat.id,
          message_id: cq.message.message_id,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          ...built,
        });
      }
      await tg("answerCallbackQuery", { callback_query_id: cq.id, text: built ? undefined : "Не вдалося" });
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

  // /status TT-… або /status Z-… — картка з кнопками статусів (для старих заявок без кнопок).
  const stc = /^\/status(?:@\w+)?\s+((?:TT|Z)-\d{8}-\d{3,})/i.exec(text);
  if (stc?.[1]) {
    await sendStatusCard(msg.chat.id, stc[1].toUpperCase(), msg.message_id);
    return ok();
  }

  // /link TT-20261020-00011 або /link 0671234567 — посилання для старих замовлень і
  // швидких замовлень / консультацій (за телефоном — останній продаж цьому клієнту).
  const link = /^\/(?:link|vidguk)(?:@\w+)?\s+(.+)$/i.exec(text);
  if (link?.[1]) {
    const arg = link[1].trim();
    const num = /(TT|Z)-\d{8}-\d{3,}/i.exec(arg)?.[0]?.toUpperCase();
    const phone = num ? null : normalizePhone(arg);
    if (num || phone) {
      await sendInvite(msg.chat.id, (num ?? phone)!, msg.message_id);
    } else {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        reply_to_message_id: msg.message_id,
        text: "Формат: /link TT-20261020-00016, /link Z-20261022-00018 або /link 067 123 45 67",
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
