// src/lib/telegram/cards.ts
// Картки заявок і замовлень у Telegram — ОДИН стиль для всіх трьох типів:
// 🆕 замовлення з кошика, ⚡ швидке замовлення з картки товару, 📩 консультація.
//
// Картка збирається з БАЗИ (а не з даних запиту), тому нове сповіщення, /status і
// перемальовування після зміни статусу виглядають однаково. Статус — рядком у тексті
// («📌 Статус: …, хто, коли»), під повідомленням — лише кнопки вибору.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LeadStatus, OrderStatus } from "@/lib/supabase/types";
import { LEAD_STATUS, ORDER_STATUS } from "@/lib/crm/status";
import { getProductBySlug, getMinPrice } from "@/data/catalog";
import { applyOverrides, getOverrides } from "@/lib/catalog/overrides";
import { productPageUrl, slugFromProductId } from "@/lib/catalog/product-url";
import { siteConfig } from "@/config/site";
import { botChatId, kyivTime, tg, tgEsc, tgEscAttr, type InlineButton, type InlineKeyboard } from "./bot";

type Sb = SupabaseClient<Database>;

/* ---------------- Дрібниці форматування ---------------- */

/** 12500 → «12 500 грн» (без Intl/ICU). */
const uah = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} грн`;

const link = (url: string | null | undefined, text: string) =>
  url ? `<a href="${tgEscAttr(url)}">${tgEsc(text)}</a>` : tgEsc(text);

/** +380990470907 — Telegram сам робить номер «натисни й подзвони». */
function phone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  const nine = d.length >= 9 ? d.slice(-9) : null;
  return nine ? `+380${nine}` : raw;
}

const LANG: Record<string, string> = { uk: "🇺🇦 UA", ua: "🇺🇦 UA", ru: "🇷🇺 RU" };

const DELIVERY: Record<string, string> = { np: "Нова Пошта", ukrposhta: "Укрпошта", pickup: "Самовивіз" };
const PAYMENT: Record<string, string> = { cod: "Накладений платіж", card: "Картка онлайн", apple: "Apple Pay" };

/** google.com.ua → Google, chatgpt.com → ChatGPT; невідоме — як є. */
function sourceName(host: string): string {
  const h = host.toLowerCase();
  const known: [RegExp, string][] = [
    [/(^|\.)google\./, "Google"],
    [/chatgpt\.com|openai\.com/, "ChatGPT"],
    [/perplexity/, "Perplexity"],
    [/instagram/, "Instagram"],
    [/facebook|fb\.com/, "Facebook"],
    [/(^|\.)t\.me$|telegram/, "Telegram"],
    [/bing\./, "Bing"],
    [/youtube/, "YouTube"],
    [/tiktok/, "TikTok"],
    [/viber/, "Viber"],
  ];
  return known.find(([re]) => re.test(h))?.[1] ?? host;
}

/** «Звідки клієнт»: сторінка входу + джерело (utm або сайт-реферер). */
function originLine(attr: Record<string, unknown> | null | undefined): string | null {
  if (!attr) return null;
  const str = (k: string) => (typeof attr[k] === "string" && (attr[k] as string).trim() ? (attr[k] as string).trim() : null);
  const parts: string[] = [];
  const landing = str("landing_page");
  if (landing) {
    try {
      const u = new URL(landing, siteConfig.url);
      const path = decodeURIComponent(u.pathname).replace(/\/$/, "") || "/";
      parts.push(link(`${siteConfig.url}${u.pathname}`, path.length > 48 ? `${path.slice(0, 47)}…` : path));
    } catch {
      /* битий URL — пропускаємо */
    }
  }
  const utm = str("utm_source");
  const medium = str("utm_medium");
  if (utm) parts.push(tgEsc(medium ? `${sourceName(utm)} / ${medium}` : sourceName(utm)));
  else if (str("gclid")) parts.push("Google Ads");
  else if (str("fbclid")) parts.push("Facebook / Instagram");
  else {
    const ref = str("referrer");
    if (ref) {
      try {
        const host = new URL(ref).hostname.replace(/^www\./, "");
        if (!host.endsWith("ttmax.com.ua")) parts.push(tgEsc(sourceName(host)));
      } catch {
        /* ігноруємо */
      }
    } else parts.push("прямий захід");
  }
  return parts.length ? `📍 ${parts.join(" · ")}` : null;
}

type Last = { by: string | null; at: string } | null;

function statusLine(icon: string, label: string, last: Last): string {
  // «Імʼя (Telegram)» → «Імʼя»; «mail@x.com (CRM)» → «mail».
  const by =
    last?.by && last.by !== "system" ? last.by.replace(/\s*\((Telegram|CRM)\)$/, "").replace(/@.*$/, "") : null;
  return `📌 <b>Статус: ${icon} ${label}</b>${last ? ` · ${by ? `${tgEsc(by)}, ` : ""}${kyivTime(last.at)}` : ""}`;
}

/* ---------------- Кнопки ---------------- */

/** «⭐ Посилання на відгук» — лише коли відгуки ввімкнені й є що оцінювати. */
const reviewRow = (ref: string | null): InlineButton[][] =>
  process.env.REVIEWS_SECRET && ref ? [[{ text: "⭐ Посилання на відгук", callback_data: `inv:${ref}` }]] : [];

export function leadKeyboard(id: string, status: LeadStatus, reviewRef: string | null): InlineKeyboard {
  const b = (s: LeadStatus): InlineButton => ({
    text: `${status === s ? "● " : ""}${LEAD_STATUS[s].icon} ${LEAD_STATUS[s].label}`,
    callback_data: `ls:${LEAD_STATUS[s].code}:${id}`,
  });
  return {
    inline_keyboard: [
      [b("new"), b("contacted"), b("qualified")],
      [b("in_progress"), b("won"), b("lost")],
      [b("unqualified")],
      ...reviewRow(reviewRef),
    ],
  };
}

export function orderKeyboard(id: string, status: OrderStatus, orderNumber: string): InlineKeyboard {
  const b = (s: OrderStatus): InlineButton => ({
    text: `${status === s ? "● " : ""}${ORDER_STATUS[s].icon} ${ORDER_STATUS[s].label}`,
    callback_data: `os:${ORDER_STATUS[s].code}:${id}`,
  });
  return {
    inline_keyboard: [
      [b("pending"), b("processing"), b("paid")],
      [b("shipped"), b("delivered")],
      [b("cancelled"), b("refunded")],
      ...reviewRow(orderNumber),
    ],
  };
}

/* ---------------- Дані ---------------- */

const toLast = (r: { changed_by: string | null; created_at: string } | null): Last =>
  r ? { by: r.changed_by, at: r.created_at } : null;

async function lastLeadEvent(sb: Sb, leadId: string): Promise<Last> {
  const { data } = await sb
    .from("lead_events")
    .select("changed_by, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return toLast(data as { changed_by: string | null; created_at: string } | null);
}

async function lastOrderEvent(sb: Sb, orderId: string): Promise<Last> {
  const { data } = await sb
    .from("order_events")
    .select("changed_by, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return toLast(data as { changed_by: string | null; created_at: string } | null);
}

type OrderFull = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  locale: string;
  delivery_method: string;
  delivery_city: string | null;
  delivery_branch: string | null;
  payment_method: string;
  subtotal_uah: number;
  shipping_uah: number;
  total_uah: number;
  comment: string | null;
  status: OrderStatus;
  attribution: Record<string, unknown> | null;
  tg_chat_id: number | null;
  tg_message_id: number | null;
  order_items: { product_id: string; brand: string; model: string; qty: number; line_total_uah: number }[] | null;
};

type LeadFull = {
  id: string;
  lead_number: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  locale: string;
  status: LeadStatus;
  attribution: Record<string, unknown> | null;
  value_uah: number | null;
  notes: string | null;
  tg_chat_id: number | null;
  tg_message_id: number | null;
};

const ORDER_COLS =
  "id, order_number, created_at, customer_name, customer_phone, customer_email, locale, delivery_method, delivery_city, delivery_branch, payment_method, subtotal_uah, shipping_uah, total_uah, comment, status, attribution, tg_chat_id, tg_message_id, order_items(product_id, brand, model, qty, line_total_uah)";
const LEAD_COLS =
  "id, lead_number, created_at, name, phone, email, source, locale, status, attribution, value_uah, notes, tg_chat_id, tg_message_id";

const crmUrl = (path: string) => `${siteConfig.url}/admin/leads${path}`;

/* ---------------- Тексти карток ---------------- */

export function orderText(o: OrderFull, last: Last, leadId: string | null): string {
  const L: string[] = [];
  L.push(`🆕 <b>Нове замовлення</b> · <code>${tgEsc(o.order_number)}</code>`, "");
  L.push(`👤 <b>${tgEsc(o.customer_name)}</b>`, `📞 ${tgEsc(phone(o.customer_phone))}`);
  if (o.customer_email) L.push(`✉️ ${tgEsc(o.customer_email)}`);

  L.push("", "🛒 <b>Товари</b>");
  for (const it of o.order_items ?? []) {
    const url = productPageUrl(slugFromProductId(it.product_id));
    L.push(`• ${link(url, `${it.brand} ${it.model}`)} ×${it.qty} — ${uah(Number(it.line_total_uah))}`);
  }

  const place = [o.delivery_city, o.delivery_branch]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .map((s) => tgEsc(s))
    .join(", ");
  L.push(
    "",
    `📦 ${DELIVERY[o.delivery_method] ?? tgEsc(o.delivery_method)}${
      o.delivery_method === "pickup" ? "" : ` — ${Number(o.shipping_uah) > 0 ? uah(Number(o.shipping_uah)) : "безкоштовно"}`
    }`,
  );
  if (place) L.push(`      ${place}`);
  L.push(`💳 ${PAYMENT[o.payment_method] ?? tgEsc(o.payment_method)}`);
  if (o.comment) L.push(`📝 <i>${tgEsc(o.comment)}</i>`);

  L.push(
    "",
    `💰 <b>Разом: ${uah(Number(o.total_uah))}</b>`,
    `      товари ${uah(Number(o.subtotal_uah))}${Number(o.shipping_uah) > 0 ? ` + доставка ${uah(Number(o.shipping_uah))}` : ""}`,
  );

  L.push("", `${LANG[o.locale] ?? tgEsc(o.locale)} · ${kyivTime(o.created_at)}`);
  const origin = originLine(o.attribution);
  if (origin) L.push(origin);
  L.push("", statusLine(ORDER_STATUS[o.status].icon, ORDER_STATUS[o.status].label, last));
  L.push(link(crmUrl(leadId ? `/${leadId}` : ""), "Відкрити в CRM →"));
  return L.join("\n");
}

export async function leadText(l: LeadFull, last: Last): Promise<string> {
  const quick = l.source === "quick-order";
  const title = quick ? "⚡ <b>Швидке замовлення</b>" : l.source === "consultation" ? "📩 <b>Консультація</b>" : "📩 <b>Заявка</b>";
  const L: string[] = [`${title} · <code>${tgEsc(l.lead_number)}</code>`, ""];

  const placeholder = /^(швидке замовлення|быстрый заказ)$/i.test(l.name.trim());
  L.push(`👤 <b>${placeholder ? "Без імені" : tgEsc(l.name)}</b>`, `📞 ${tgEsc(phone(l.phone))}`);
  if (l.email) L.push(`✉️ ${tgEsc(l.email)}`);

  // Товар зі швидкого замовлення: посилання + актуальна ціна з каталогу (з адмінки).
  const slug = typeof l.attribution?.productSlug === "string" ? l.attribution.productSlug : null;
  const productName = typeof l.attribution?.product === "string" ? l.attribution.product : null;
  if (slug || productName) {
    const p = slug ? getProductBySlug(slug) : undefined;
    let price = "";
    if (p) {
      // Ціна з адмінки (оверрайди); якщо кеш недоступний — ціна з коду, картка не падає.
      const ov = await getOverrides().catch(() => ({}));
      const ep = applyOverrides(p, ov);
      const prices = ep.variants.map((v) => v.price).filter((n): n is number => typeof n === "number" && n > 0);
      const min = getMinPrice(ep);
      if (typeof min === "number" && min > 0) {
        price = ` — ${prices.length > 1 && Math.max(...prices) > min ? "від " : ""}${uah(min)}`;
      }
    }
    L.push("", "🛒 <b>Товар</b>", `• ${link(productPageUrl(slug), productName ?? p?.name.ua ?? slug ?? "")}${price}`);
  }

  if (l.value_uah && Number(l.value_uah) > 0) L.push("", `💰 <b>Сума угоди: ${uah(Number(l.value_uah))}</b>`);
  if (l.notes) L.push(`📝 <i>${tgEsc(l.notes.length > 300 ? `${l.notes.slice(0, 299)}…` : l.notes)}</i>`);

  L.push("", `${LANG[l.locale] ?? tgEsc(l.locale)} · ${kyivTime(l.created_at)}`);
  const origin = originLine(l.attribution);
  if (origin) L.push(origin);
  L.push("", statusLine(LEAD_STATUS[l.status].icon, LEAD_STATUS[l.status].label, last));
  L.push(link(crmUrl(`/${l.id}`), "Відкрити в CRM →"));
  return L.join("\n");
}

/* ---------------- Зібрати / надіслати / перемалювати ---------------- */

type Card = { text: string; reply_markup: InlineKeyboard; chatId: number | null; messageId: number | null };

async function orderCard(sb: Sb, orderId: string): Promise<Card | null> {
  const { data } = await sb.from("orders").select(ORDER_COLS).eq("id", orderId).maybeSingle();
  const o = data as unknown as OrderFull | null;
  if (!o) return null;
  const [last, mirror] = await Promise.all([
    lastOrderEvent(sb, o.id),
    sb.from("leads").select("id").eq("lead_number", o.order_number).maybeSingle(),
  ]);
  const leadId = (mirror.data as { id: string } | null)?.id ?? null;
  return {
    text: orderText(o, last, leadId),
    reply_markup: orderKeyboard(o.id, o.status, o.order_number),
    chatId: o.tg_chat_id,
    messageId: o.tg_message_id,
  };
}

async function leadCard(sb: Sb, leadId: string): Promise<Card | null> {
  const { data } = await sb.from("leads").select(LEAD_COLS).eq("id", leadId).maybeSingle();
  const l = data as unknown as LeadFull | null;
  if (!l) return null;
  const reviewRef = l.source !== "order" && typeof l.attribution?.productSlug === "string" ? l.lead_number : null;
  return {
    text: await leadText(l, await lastLeadEvent(sb, l.id)),
    reply_markup: leadKeyboard(l.id, l.status, reviewRef),
    chatId: l.tg_chat_id,
    messageId: l.tg_message_id,
  };
}

async function send(card: Card, replyTo?: number): Promise<{ chatId: number; messageId: number } | null> {
  const chatId = botChatId();
  if (!chatId) return null;
  const msg = await tg<{ message_id: number; chat: { id: number } }>("sendMessage", {
    chat_id: chatId,
    text: card.text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: card.reply_markup,
    ...(replyTo ? { reply_to_message_id: replyTo } : {}),
  });
  return msg ? { chatId: msg.chat.id, messageId: msg.message_id } : null;
}

/** Надіслати картку замовлення й запамʼятати повідомлення (його потім перемальовує зміна статусу). */
export async function sendOrderCard(sb: Sb, orderId: string, replyTo?: number): Promise<boolean> {
  const card = await orderCard(sb, orderId);
  const sent = card ? await send(card, replyTo) : null;
  if (sent) await sb.from("orders").update({ tg_chat_id: sent.chatId, tg_message_id: sent.messageId }).eq("id", orderId);
  return Boolean(sent);
}

export async function sendLeadCard(sb: Sb, leadId: string, replyTo?: number): Promise<boolean> {
  const card = await leadCard(sb, leadId);
  const sent = card ? await send(card, replyTo) : null;
  if (sent) await sb.from("leads").update({ tg_chat_id: sent.chatId, tg_message_id: sent.messageId }).eq("id", leadId);
  return Boolean(sent);
}

async function redraw(card: Card | null): Promise<void> {
  if (!card?.chatId || !card.messageId) return;
  await tg("editMessageText", {
    chat_id: card.chatId,
    message_id: card.messageId,
    text: card.text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: card.reply_markup,
  });
}

export const refreshOrderCard = async (sb: Sb, orderId: string) => redraw(await orderCard(sb, orderId));
export const refreshLeadCard = async (sb: Sb, leadId: string) => redraw(await leadCard(sb, leadId));
