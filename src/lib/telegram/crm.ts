// src/lib/telegram/crm.ts
// Кнопки статусів під повідомленнями про заявку й замовлення — дзеркало CRM у Telegram.
//
// Кнопки лишаються під повідомленням і перемальовуються (editMessageReplyMarkup): поточний
// статус позначений «●», верхній рядок — хто й коли його поставив. Текст повідомлення не
// чіпаємо — він уже містить усе про клієнта, а кнопки — живий стан.
//
// Синхронізація в обидва боки:
//  • Telegram → база: setLeadStatus / setOrderStatus (ті самі тригери, що й у CRM: час етапу,
//    історія; у історію пишемо, хто натиснув);
//  • CRM → Telegram: після зміни в адмінці викликається syncAfterCrmLeadStatus.
// Замовлення і його копія в CRM (lead_number = order_number) тримаються в узгодженому стані.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LeadStatus, OrderStatus } from "@/lib/supabase/types";
import { LEAD_STATUS, ORDER_STATUS, ORDER_TO_LEAD, leadToOrder } from "@/lib/crm/status";
import { kyivTime, tg, type InlineButton, type InlineKeyboard } from "./bot";

type Sb = SupabaseClient<Database>;

type Last = { by: string | null; at: string } | null;

const lastLine = (label: string, icon: string, last: Last): InlineButton => ({
  text: `📌 ${icon} ${label}${
    last ? ` · ${last.by && last.by !== "system" ? `${last.by.replace(/\s*\((Telegram|CRM)\)$/, "")}, ` : ""}${kyivTime(last.at)}` : ""
  }`,
  callback_data: "noop",
});

/** Кнопка «посилання на відгук» (якщо відгуки ввімкнені й є що оцінювати). */
const reviewRow = (ref: string | null): InlineButton[][] =>
  process.env.REVIEWS_SECRET && ref ? [[{ text: "⭐ Посилання на відгук", callback_data: `inv:${ref}` }]] : [];

export function leadKeyboard(lead: {
  id: string;
  status: LeadStatus;
  /** Номер для кнопки відгуку — лише для заявок із товаром. */
  reviewRef: string | null;
  last?: Last;
}): InlineKeyboard {
  const b = (s: LeadStatus): InlineButton => ({
    text: `${lead.status === s ? "● " : ""}${LEAD_STATUS[s].icon} ${LEAD_STATUS[s].label}`,
    callback_data: `ls:${LEAD_STATUS[s].code}:${lead.id}`,
  });
  const cur = LEAD_STATUS[lead.status];
  return {
    inline_keyboard: [
      [lastLine(cur.label, cur.icon, lead.last ?? null)],
      [b("new"), b("contacted"), b("qualified")],
      [b("in_progress"), b("won"), b("lost")],
      [b("unqualified")],
      ...reviewRow(lead.reviewRef),
    ],
  };
}

export function orderKeyboard(order: { id: string; status: OrderStatus; orderNumber: string; last?: Last }): InlineKeyboard {
  const b = (s: OrderStatus): InlineButton => ({
    text: `${order.status === s ? "● " : ""}${ORDER_STATUS[s].icon} ${ORDER_STATUS[s].label}`,
    callback_data: `os:${ORDER_STATUS[s].code}:${order.id}`,
  });
  const cur = ORDER_STATUS[order.status];
  return {
    inline_keyboard: [
      [lastLine(cur.label, cur.icon, order.last ?? null)],
      [b("pending"), b("processing"), b("paid")],
      [b("shipped"), b("delivered")],
      [b("cancelled"), b("refunded")],
      ...reviewRow(order.orderNumber),
    ],
  };
}

/* ---------------- Читання стану ---------------- */

async function lastLeadEvent(sb: Sb, leadId: string): Promise<Last> {
  const { data } = await sb
    .from("lead_events")
    .select("changed_by, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { by: (data as { changed_by: string | null }).changed_by, at: (data as { created_at: string }).created_at } : null;
}

async function lastOrderEvent(sb: Sb, orderId: string): Promise<Last> {
  const { data } = await sb
    .from("order_events")
    .select("changed_by, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { by: (data as { changed_by: string | null }).changed_by, at: (data as { created_at: string }).created_at } : null;
}

type LeadLite = {
  id: string;
  status: LeadStatus;
  source: string;
  lead_number: string;
  attribution: { productSlug?: unknown } | null;
  tg_chat_id: number | null;
  tg_message_id: number | null;
};

const leadReviewRef = (l: LeadLite) =>
  l.source !== "order" && typeof l.attribution?.productSlug === "string" ? l.lead_number : null;

async function getLead(sb: Sb, id: string): Promise<LeadLite | null> {
  const { data } = await sb
    .from("leads")
    .select("id, status, source, lead_number, attribution, tg_chat_id, tg_message_id")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as LeadLite) ?? null;
}

type OrderLite = { id: string; status: OrderStatus; order_number: string; tg_chat_id: number | null; tg_message_id: number | null };

async function getOrder(sb: Sb, by: { id?: string; number?: string }): Promise<OrderLite | null> {
  let q = sb.from("orders").select("id, status, order_number, tg_chat_id, tg_message_id");
  q = by.id ? q.eq("id", by.id) : q.eq("order_number", by.number ?? "");
  const { data } = await q.maybeSingle();
  return (data as unknown as OrderLite) ?? null;
}

/* ---------------- Перемалювати кнопки ---------------- */

export async function leadKeyboardFor(sb: Sb, leadId: string): Promise<InlineKeyboard | null> {
  const l = await getLead(sb, leadId);
  if (!l) return null;
  return leadKeyboard({ id: l.id, status: l.status, reviewRef: leadReviewRef(l), last: await lastLeadEvent(sb, l.id) });
}

export async function orderKeyboardFor(sb: Sb, orderId: string): Promise<InlineKeyboard | null> {
  const o = await getOrder(sb, { id: orderId });
  if (!o) return null;
  return orderKeyboard({ id: o.id, status: o.status, orderNumber: o.order_number, last: await lastOrderEvent(sb, o.id) });
}

async function redraw(chatId: number | null, messageId: number | null, kb: InlineKeyboard | null): Promise<void> {
  if (!chatId || !messageId || !kb) return;
  await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: kb });
}

export async function refreshLeadMessage(sb: Sb, leadId: string): Promise<void> {
  const l = await getLead(sb, leadId);
  if (l) await redraw(l.tg_chat_id, l.tg_message_id, await leadKeyboardFor(sb, leadId));
}

export async function refreshOrderMessage(sb: Sb, orderId: string): Promise<void> {
  const o = await getOrder(sb, { id: orderId });
  if (o) await redraw(o.tg_chat_id, o.tg_message_id, await orderKeyboardFor(sb, orderId));
}

/* ---------------- Зміна статусу ---------------- */

/** Хто змінив — в історію події (тригер пише 'system', уточнюємо останній запис). */
export async function signLeadEvent(sb: Sb, leadId: string, by: string) {
  const { data } = await sb
    .from("lead_events")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) await sb.from("lead_events").update({ changed_by: by.slice(0, 80) }).eq("id", (data as { id: string }).id);
}

async function signOrderEvent(sb: Sb, orderId: string, by: string) {
  const { data } = await sb
    .from("order_events")
    .select("id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) await sb.from("order_events").update({ changed_by: by.slice(0, 80) }).eq("id", (data as { id: string }).id);
}

/** Статус заявки з Telegram. Для копії замовлення — міняє й саме замовлення. */
export async function setLeadStatus(sb: Sb, leadId: string, status: LeadStatus, by: string): Promise<boolean> {
  const l = await getLead(sb, leadId);
  if (!l) return false;
  if (l.status !== status) {
    const { error } = await sb.from("leads").update({ status }).eq("id", leadId);
    if (error) return false;
    await signLeadEvent(sb, leadId, by);
  }
  // Перемальовує повідомлення заявки (або замовлення, якщо це його копія).
  await syncAfterLeadChange(sb, leadId, by);
  return true;
}

/** Статус замовлення з Telegram + його копії в CRM. */
export async function setOrderStatus(sb: Sb, orderId: string, status: OrderStatus, by: string): Promise<boolean> {
  const o = await getOrder(sb, { id: orderId });
  if (!o) return false;
  if (o.status !== status) {
    const { error } = await sb.from("orders").update({ status }).eq("id", orderId);
    if (error) return false;
    await signOrderEvent(sb, orderId, by);
  }
  // Копія в CRM (lead_number = номер замовлення) — на відповідний етап.
  const { data: mirror } = await sb.from("leads").select("id, status").eq("lead_number", o.order_number).maybeSingle();
  const m = mirror as { id: string; status: LeadStatus } | null;
  if (m && m.status !== ORDER_TO_LEAD[status]) {
    const { error } = await sb.from("leads").update({ status: ORDER_TO_LEAD[status] }).eq("id", m.id);
    if (!error) await signLeadEvent(sb, m.id, by);
  }
  await refreshOrderMessage(sb, orderId);
  return true;
}

/**
 * Після зміни статусу заявки (з Telegram чи з CRM): якщо це копія замовлення — підтягнути
 * статус замовлення й перемалювати його повідомлення; інакше — повідомлення заявки.
 */
export async function syncAfterLeadChange(sb: Sb, leadId: string, by: string): Promise<void> {
  const l = await getLead(sb, leadId);
  if (!l) return;
  if (l.source === "order" && l.lead_number.startsWith("TT-")) {
    const o = await getOrder(sb, { number: l.lead_number });
    if (!o) return;
    const next = leadToOrder(l.status, o.status);
    if (next) {
      const { error } = await sb.from("orders").update({ status: next }).eq("id", o.id);
      if (!error) await signOrderEvent(sb, o.id, by);
    }
    await refreshOrderMessage(sb, o.id);
  } else {
    await refreshLeadMessage(sb, leadId);
  }
}
