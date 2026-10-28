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
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
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
const PAYMENT: Record<string, string> = { cod: "Накладений платіж", card: "Картка онлайн", apple: "Apple Pay", cash: "Готівка" };

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

/** Сторінка входу + джерело (utm, рекламний клік або сайт-реферер) — одним рядком. */
function describeTouch(t: {
  landing: string | null;
  utm: string | null;
  medium: string | null;
  gclid: string | null;
  fbclid: string | null;
  referrer: string | null;
}): string | null {
  const parts: string[] = [];
  if (t.landing) {
    try {
      const u = new URL(t.landing, siteConfig.url);
      const path = decodeURIComponent(u.pathname).replace(/\/$/, "") || "/";
      parts.push(link(`${siteConfig.url}${u.pathname}`, path.length > 48 ? `${path.slice(0, 47)}…` : path));
    } catch {
      /* битий URL — пропускаємо */
    }
  }
  if (t.utm) parts.push(tgEsc(t.medium ? `${sourceName(t.utm)} / ${t.medium}` : sourceName(t.utm)));
  else if (t.gclid) parts.push("Google Ads");
  else if (t.fbclid) parts.push("Facebook / Instagram");
  else {
    let host: string | null = null;
    try {
      host = t.referrer ? new URL(t.referrer).hostname.replace(/^www\./, "") : null;
    } catch {
      /* ігноруємо */
    }
    if (host && !host.endsWith("ttmax.com.ua")) parts.push(tgEsc(sourceName(host)));
    else if (!host) parts.push("прямий захід");
  }
  return parts.length ? parts.join(" · ") : null;
}

/**
 * «Звідки клієнт»: поточний візит + перший візит браузера (якщо відрізняється).
 *
 * ⚠️ НАВІЩО два рядки: перший візит (landing_page, utm_*) сайт пам'ятає назавжди. 28.10.2026
 * заявка зі статті блогу прийшла з «qr-code / visit-card», бо колись із цього телефона
 * сканували QR — менеджер бачив хибне джерело. Тепер головний рядок — поточний візит
 * (visit_*, attribution.ts), а перший — під ним, лише якщо він інший. Старі заявки без
 * visit_* показуються як раніше.
 */
function originLine(attr: Record<string, unknown> | null | undefined): string | null {
  if (!attr) return null;
  // Замовлення, внесене вручну (продаж наживо знайомим, спецціна) — без сторінки входу й джерела.
  if (attr.channel === "offline") return "🤝 Продаж наживо (внесено вручну)";
  const str = (k: string) => (typeof attr[k] === "string" && (attr[k] as string).trim() ? (attr[k] as string).trim() : null);
  const first = describeTouch({
    landing: str("landing_page"),
    utm: str("utm_source"),
    medium: str("utm_medium"),
    gclid: str("gclid"),
    fbclid: str("fbclid"),
    referrer: str("referrer"),
  });
  if (!str("visit_landing")) return first ? `📍 ${first}` : null;
  const visit = describeTouch({
    landing: str("visit_landing"),
    utm: str("visit_utm_source"),
    medium: str("visit_utm_medium"),
    gclid: str("visit_gclid"),
    fbclid: str("visit_fbclid"),
    referrer: str("visit_referrer"),
  });
  const L: string[] = [];
  if (visit) L.push(`📍 ${visit}`);
  if (first && first !== visit) L.push(`🕐 Перший візит: ${first}`);
  return L.length ? L.join("\n") : null;
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
  L.push(`👤 <b>${tgEsc(o.customer_name)}</b>`);
  if (o.customer_phone.trim()) L.push(`📞 ${tgEsc(phone(o.customer_phone))}`);
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
  // Заявка «в 1 клік» з кошика: склад кошика — у notes (api/leads, cartNotes), сума — у value_uah.
  const fromCart = l.source === "cart-quick-order";
  // Підбір зі статті блогу: товару немає, в attribution.product — назва статті (BlogConsult).
  const fromBlog = l.source === "blog-consult";
  const title = fromCart
    ? "🛒 <b>Замовлення в 1 клік (кошик)</b>"
    : fromBlog
      ? "🎯 <b>Підбір інвентарю (зі статті блогу)</b>"
      : quick ? "⚡ <b>Швидке замовлення</b>" : l.source === "consultation" ? "📩 <b>Консультація</b>" : "📩 <b>Заявка</b>";
  const L: string[] = [`${title} · <code>${tgEsc(l.lead_number)}</code>`, ""];

  const placeholder = /^(швидке замовлення|быстрый заказ)$/i.test(l.name.trim());
  L.push(`👤 <b>${placeholder ? "Без імені" : tgEsc(l.name)}</b>`);
  if (l.phone.trim()) L.push(`📞 ${tgEsc(phone(l.phone))}`);
  if (l.email) L.push(`✉️ ${tgEsc(l.email)}`);

  // Товар зі швидкого замовлення: посилання + актуальна ціна з каталогу (з адмінки).
  const slug = typeof l.attribution?.productSlug === "string" ? l.attribution.productSlug : null;
  const productName = typeof l.attribution?.product === "string" ? l.attribution.product : null;
  if (fromBlog && productName) {
    L.push("", `📖 Стаття: ${tgEsc(productName)}`);
  } else if (slug || productName) {
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
  // Для кошика notes — це склад замовлення (до 30 позицій), тож не обрізаємо на 300 символах.
  const notesMax = fromCart ? 2000 : 300;
  if (l.notes) L.push(`📝 <i>${tgEsc(l.notes.length > notesMax ? `${l.notes.slice(0, notesMax - 1)}…` : l.notes)}</i>`);

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

/* ---------------- Фото товарів над карткою ---------------- */

type PhotoItem = { slug: string; caption: string };

/**
 * URL фото для Telegram: JPG і без dpr_auto.
 * ⚠️ НЕ cldUrl як є: там f_auto, і Cloudinary може віддати WebP/AVIF — Telegram такі
 * «фото за посиланням» не завжди приймає, і весь альбом падає разом.
 */
function tgPhotoUrl(publicId: string): string {
  const url = cldUrl(publicId, { w: 800, h: 800, crop: "pad", bg: "auto" });
  return url.replace("f_auto,", "f_jpg,").replace(",dpr_auto", "");
}

/**
 * Альбом фото товарів ПЕРЕД карткою (сама картка — останнім повідомленням, з кнопками).
 *
 * НАВІЩО: менеджеру з самого тексту не видно, що саме замовили (колір, модель) — треба
 * відкривати посилання. Окремим повідомленням, а не фото в самій картці: картку потім
 * перемальовує editMessageText при зміні статусу, а підпис фото обмежений 1024 символами.
 *
 * ⚠️ Будь-яка помилка тут не повинна зупинити картку: фото — зручність, картка — головне.
 * Фото беремо головне (sort 0) за slug; комбо-ракетки без власних фото просто пропускаються.
 */
async function sendPhotos(chatId: string, items: PhotoItem[], replyTo?: number): Promise<void> {
  try {
    if (!items.length) return;
    const media = await getMediaMap();
    const seen = new Set<string>();
    const photos: { type: "photo"; media: string; caption: string }[] = [];
    for (const it of items) {
      if (!it.slug || seen.has(it.slug)) continue;
      const m = pickPrimary(media, "product", it.slug);
      const url = m ? tgPhotoUrl(m.publicId) : "";
      if (!url) continue;
      seen.add(it.slug);
      photos.push({ type: "photo", media: url, caption: it.caption.slice(0, 1000) });
    }
    if (!photos.length) return;
    const reply = replyTo ? { reply_to_message_id: replyTo } : {};
    const first = photos[0]!;
    if (photos.length === 1) {
      await tg("sendPhoto", { chat_id: chatId, photo: first.media, caption: first.caption, ...reply });
    } else {
      // sendMediaGroup приймає 2–10 елементів.
      await tg("sendMediaGroup", { chat_id: chatId, media: photos.slice(0, 10), ...reply });
    }
  } catch (err) {
    console.error("[telegram] photos failed:", err instanceof Error ? err.message : err);
  }
}

async function orderPhotoItems(sb: Sb, orderId: string): Promise<PhotoItem[]> {
  const { data } = await sb.from("orders").select("order_items(product_id, brand, model, qty)").eq("id", orderId).maybeSingle();
  const items = (data as { order_items: { product_id: string; brand: string; model: string; qty: number }[] | null } | null)
    ?.order_items;
  return (items ?? []).map((it) => ({
    slug: slugFromProductId(it.product_id),
    caption: `${it.brand} ${it.model} ×${it.qty}`,
  }));
}

async function leadPhotoItems(sb: Sb, leadId: string): Promise<PhotoItem[]> {
  const { data } = await sb.from("leads").select("source, attribution").eq("id", leadId).maybeSingle();
  const l = data as { source: string; attribution: Record<string, unknown> | null } | null;
  // Лише швидке замовлення з картки: там відомий конкретний товар (productSlug).
  const slug = l?.source === "quick-order" ? l.attribution?.productSlug : null;
  if (typeof slug !== "string" || !slug) return [];
  const name = typeof l?.attribution?.product === "string" ? l.attribution.product : slug;
  return [{ slug, caption: name }];
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
  const chatId = botChatId();
  if (card && chatId) await sendPhotos(chatId, await orderPhotoItems(sb, orderId), replyTo);
  const sent = card ? await send(card, replyTo) : null;
  if (sent) await sb.from("orders").update({ tg_chat_id: sent.chatId, tg_message_id: sent.messageId }).eq("id", orderId);
  return Boolean(sent);
}

export async function sendLeadCard(sb: Sb, leadId: string, replyTo?: number): Promise<boolean> {
  const card = await leadCard(sb, leadId);
  const chatId = botChatId();
  if (card && chatId) await sendPhotos(chatId, await leadPhotoItems(sb, leadId), replyTo);
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

/** Картка за номером: TT-… — замовлення, Z-… — заявка. false — не знайдено або не надіслано. */
export async function sendCardByNumber(sb: Sb, num: string, replyTo?: number): Promise<boolean> {
  if (num.startsWith("TT-")) {
    const { data } = await sb.from("orders").select("id").eq("order_number", num).maybeSingle();
    return data ? sendOrderCard(sb, (data as { id: string }).id, replyTo) : false;
  }
  const { data } = await sb.from("leads").select("id").eq("lead_number", num).maybeSingle();
  return data ? sendLeadCard(sb, (data as { id: string }).id, replyTo) : false;
}
