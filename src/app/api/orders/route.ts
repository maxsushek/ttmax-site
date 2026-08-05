import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notifyNewOrder } from "@/lib/telegram/notify";
import { getProductBySlug, getMinPrice } from "@/data/catalog";
import { getOverrides, applyOverrides } from "@/lib/catalog/overrides";
import { resolveCombo } from "@/lib/catalog/racket";
import { computeShipping } from "@/lib/checkout/shipping";
import { locales, localeToLang } from "@/i18n/config";
import { getContact } from "@/lib/contact/get";
import { AVAILABLE_PAYMENT_METHODS, PAYMENT_METHODS } from "@/config/payment";
import { AttributionSchema } from "@/lib/analytics/attribution-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const phoneRe = /^(\+?380|0)(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/;

const OrderItemSchema = z.object({
  productId: z.string().min(1).max(120),
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(160),
  category: z.string().max(40).optional().nullable(),
  emoji: z.string().max(8).optional().nullable(),
  price: z.number().positive().max(1_000_000),
  qty: z.number().int().positive().max(999),
});

const OrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .transform((v) => v.replace(/[\s\-()]/g, ""))
      .refine((v) => phoneRe.test(v), "Invalid Ukrainian phone"),
    email: z.string().email().optional().nullable(),
  }),
  delivery: z.object({
    method: z.enum(["np", "ukrposhta", "pickup"]),
    city: z.string().max(120).optional().nullable(),
    branch: z.string().max(240).optional().nullable(),
  }),
  payment: z.object({
    /**
     * ⚠️ Перелік береться з config/payment.ts, а НЕ зашитий тут.
     *
     * Сховати спосіб лише в UI недостатньо: чекаут — звичайний fetch, і підроблений
     * POST із method:"card" створив би замовлення, помічене як оплачене карткою, хоча
     * платіжного шлюзу не існує. Сервер мусить відхиляти те, чого магазин не приймає.
     * Коли онлайн-оплату ввімкнуть у конфігу — цей enum розшириться сам.
     */
    method: z
      .enum(PAYMENT_METHODS)
      .refine((v) => AVAILABLE_PAYMENT_METHODS.includes(v), {
        message: "Payment method is not available",
      }),
  }),
  items: z.array(OrderItemSchema).min(1).max(50),
  totals: z.object({
    subtotal: z.number().nonnegative().max(10_000_000),
    shipping: z.number().nonnegative().max(10_000),
    total: z.number().positive().max(10_000_000),
  }),
  comment: z.string().max(2000).optional().nullable(),
  /**
   * ⚠️ literal(true), а не boolean — і послаблювати не можна.
   *
   * Було z.boolean(): схема пропускала agreed:false, явної перевірки далі не було,
   * і замовлення спокійно створювалось із позначкою «згоди немає» (значення просто
   * лягало в базу, рядок 270). У чекауті галочка обов'язкова, але чекаут — звичайний
   * fetch: підроблений POST оформлював замовлення без згоди з умовами.
   *
   * Третій випадок того самого класу в цьому файлі, поряд зі способом оплати й ціною:
   * захист лише в інтерфейсі — це не захист. Сервер мусить вимагати те, без чого
   * замовлення не має існувати.
   */
  agreed: z.literal(true),
  locale: z.enum(locales),
  attribution: AttributionSchema.optional(),
});

const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60_000;

function isLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.reset < now) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  if (bucket.count > LIMIT) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  if (isLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // 0) Серверна перевірка цін: ціну диктує сервер (код + product_overrides), а не клієнт.
  //    Валідуємо лише позиції, для яких можемо однозначно визначити ціну з каталогу;
  //    showcase-товари та "ціна за запитом" не блокуємо (приймаємо як є, без регресії).
  const overrides = await getOverrides();
  for (const it of data.items) {
    const slug = it.productId.split("__")[0];
    const product = slug ? getProductBySlug(slug) : undefined;
    // ⚠️ Було `continue` — позиція, якої НЕМАЄ в каталозі, приймалась із ціною клієнта.
    // Тобто можна було замовити вигаданий товар за будь-яку суму. Тепер відхиляємо:
    // клієнт не має права замовляти те, чого в каталозі не існує.
    if (!product) {
      console.warn("[orders] unknown productId — rejecting", { productId: it.productId });
      return NextResponse.json(
        { error: "Unknown product", productId: it.productId },
        { status: 400 },
      );
    }

    const eff = applyOverrides(product, overrides);
    const variant = eff.variants.find(
      (v) => `${eff.slug}__${v.thickness}__${v.color}` === it.productId,
    );

    /**
     * ⚠️ ЗБІРНІ РАКЕТКИ РАХУЮТЬСЯ ОКРЕМО — і цю гілку не можна прибирати.
     *
     * У 95 готових ракеток `variants: []` і немає priceFrom: їхня ціна не зберігається
     * в товарі, а рахується в resolveCombo як сума компонентів мінус знижка
     * (lib/catalog/racket.ts). Тому пошук за варіантом нічого не знаходить, priceFrom
     * undefined, getMinPrice на порожніх variants теж undefined — expected виходив null.
     *
     * Наслідок був важкий: перевірка нижче відхиляла ЛЮБЕ замовлення з ракеткою з
     * помилкою «Price unavailable», тобто найдорожча категорія сайту (10 283–22 345 грн,
     * перший пункт меню) не продавалась узагалі. Покупець проходив три кроки чекауту й
     * отримував «Не вдалося оформити замовлення» — завжди, до кінця. У GA4 це не видно:
     * подія purchase шлеться лише після успіху, тож у статистиці був би трафік і нуль
     * замовлень без жодного сигналу про причину.
     *
     * ⚠️ Це наслідок правки #36, де `continue` замінили на відмову. Сама правка була
     * потрібна (без неї 64 позиції без ціни купувались за будь-яку суму), але ракетки
     * тоді не врахували: у них ціна Є, просто живе в іншому місці.
     *
     * Рахуємо тим самим resolveCombo, яким рендериться панель покупки — щоб сервер і
     * вітрина фізично не могли розійтись у числі.
     */
    const comboPrice =
      eff.combo != null ? (resolveCombo(eff, overrides).promoPrice ?? null) : null;

    const expected =
      variant && typeof variant.price === "number"
        ? variant.price
        : comboPrice != null
          ? comboPrice
          : typeof eff.priceFrom === "number"
            ? eff.priceFrom
            : (getMinPrice(eff) ?? null);

    // ⚠️ Було `continue` — тобто позиція, для якої каталог не знає ціни, приймалася з
    // ціною КЛІЄНТА. Таких позицій 64 (odyag 47, aksessuary 11, nakladki 4 та ін.), і
    // замовити їх можна було за будь-яку суму, хоч за гривню.
    // Відхиляємо: товар без ціни в каталозі не продається через кошик за визначенням —
    // у панелі покупки addToCart() виходить одразу, якщо ціни немає (hasPrice === false),
    // тож жоден легітимний сценарій сюди не потрапляє. Такі позиції купують через
    // «Швидке замовлення» — заявка й дзвінок, а не онлайн-оплата.
    if (expected == null) {
      console.warn("[orders] item without catalog price — rejecting", {
        productId: it.productId,
      });
      return NextResponse.json(
        { error: "Price unavailable", productId: it.productId },
        { status: 400 },
      );
    }

    if (Math.abs(expected - it.price) > 0.01) {
      console.warn("[orders] price mismatch — rejecting", {
        productId: it.productId,
        client: it.price,
        expected,
      });
      return NextResponse.json(
        { error: "Price changed", productId: it.productId, expected },
        { status: 409 },
      );
    }
  }

  const computedSubtotal = data.items.reduce(
    (s, i) => s + Math.round(i.price * i.qty * 100) / 100,
    0,
  );

  // ⚠️ Вартість доставки раніше бралась із тіла запиту (data.totals.shipping) і потрапляла
  // і в суму, і в БД — тобто клієнт міг проставити 0 і платити менше. Рахуємо на сервері
  // за тим самим правилом, що й у CheckoutForm.tsx:74 (total >= поріг ? 0 : тариф),
  // з тих самих налаштувань (site_settings через getContact), тож суми не розійдуться.
  const contact = await getContact();
  // ⚠️ Та сама computeShipping, що й на чекауті — щоб числа не розійшлись.
  // Спосіб доставки береться з тіла запиту, але СУМА рахується тут: клієнтському
  // totals.shipping не довіряємо, інакше можна надіслати нуль.
  const computedShipping = computeShipping({
    method: data.delivery.method,
    subtotal: computedSubtotal,
    freeShippingThreshold: contact.freeShippingThreshold,
    shippingFee: contact.shippingFee,
    ukrposhtaFee: contact.ukrposhtaFee,
  });
  if (Math.abs(computedShipping - data.totals.shipping) > 0.01) {
    console.warn("[orders] shipping mismatch — using server value", {
      client: data.totals.shipping,
      server: computedShipping,
    });
  }

  const computedTotal = Math.round((computedSubtotal + computedShipping) * 100) / 100;
  const clientTotal = Math.round(data.totals.total * 100) / 100;

  if (Math.abs(computedTotal - clientTotal) > 0.01) {
    console.warn("[orders] total mismatch — using server value", {
      client: clientTotal,
      server: computedTotal,
    });
  }

  const itemsCount = data.items.reduce((s, i) => s + i.qty, 0);

  const userAgent = request.headers.get("user-agent") ?? null;
  const referer = request.headers.get("referer") ?? null;
  const attribution: Record<string, unknown> = {
    ...(data.attribution ?? {}),
    user_agent: userAgent,
    server_referer: referer,
    ip,
    submitted_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient({ useServiceRole: true });
  if (!supabase) {
    console.error("[orders] supabase client unavailable");
    return NextResponse.json({ ok: true, persisted: false });
  }

  // 1) Створюємо шапку замовлення
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: data.customer.name,
      customer_phone: data.customer.phone,
      customer_email: data.customer.email ?? null,
      // БД: CHECK (locale IN ('uk','ru')) — мапимо код локалі URL (ua) у код мови (uk).
      locale: localeToLang[data.locale] as "ua" | "ru",
      delivery_method: data.delivery.method,
      delivery_city: data.delivery.city ?? null,
      delivery_branch: data.delivery.branch ?? null,
      payment_method: data.payment.method,
      subtotal_uah: computedSubtotal,
      shipping_uah: computedShipping,
      total_uah: computedTotal,
      items_count: itemsCount,
      comment: data.comment ?? null,
      agreed: data.agreed,
      attribution,
    })
    .select("id, order_number")
    .single();

  if (orderError || !orderRow) {
    console.error("[orders] insert error:", orderError?.message, orderError?.code);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // 2) Вставляємо позиції
  const itemsToInsert = data.items.map((i) => ({
    order_id: orderRow.id,
    product_id: i.productId,
    brand: i.brand,
    model: i.model,
    category: i.category ?? null,
    emoji: i.emoji ?? null,
    price_uah: i.price,
    qty: i.qty,
    line_total_uah: Math.round(i.price * i.qty * 100) / 100,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

  if (itemsError) {
    console.error("[orders] items insert error:", itemsError.message, itemsError.code);
    await supabase.from("orders").delete().eq("id", orderRow.id);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // 3) Дублюємо в leads, щоб замовлення з'являлось у CRM /admin/leads
  const itemsSummary = data.items.map((i) => `${i.brand} ${i.model} ×${i.qty}`).join(", ");

  const deliveryNote = [
    `Замовлення ${orderRow.order_number}`,
    `Товари: ${itemsSummary}`,
    `Доставка: ${data.delivery.method}${data.delivery.city ? `, ${data.delivery.city}` : ""}${data.delivery.branch ? `, ${data.delivery.branch}` : ""}`,
    `Оплата: ${data.payment.method}`,
    data.comment ? `Коментар: ${data.comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data: leadRow, error: leadError } = await supabase
    .from("leads")
    .insert({
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email ?? null,
      source: "order",
      locale: localeToLang[data.locale] as "ua" | "ru",
      attribution,
      value_uah: computedTotal,
      notes: deliveryNote,
    })
    .select("id")
    .single();

  if (leadError) {
    // Не валимо запит — замовлення вже збережено в orders
    console.error("[orders] lead mirror error:", leadError.message);
  }

  // 4) Telegram-сповіщення. Не блокує результат: notifyNewOrder ловить помилки
  //    всередині й повертає false, якщо токен/чат не задані або Telegram недоступний.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const leadId = leadRow?.id ?? null;
  const adminUrl = host ? `https://${host}/admin/leads${leadId ? `/${leadId}` : ""}` : null;
  after(async () => {
    await notifyNewOrder({
      orderNumber: orderRow.order_number,
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email ?? null,
      items: data.items.map((i) => ({
        brand: i.brand,
        model: i.model,
        qty: i.qty,
        lineTotal: Math.round(i.price * i.qty * 100) / 100,
      })),
      subtotal: computedSubtotal,
      shipping: computedShipping,
      total: computedTotal,
      delivery: data.delivery,
      payment: data.payment,
      comment: data.comment ?? null,
      locale: data.locale,
      adminUrl,
    });
  });

  return NextResponse.json({
    ok: true,
    persisted: true,
    orderId: orderRow.id,
    orderNumber: orderRow.order_number,
  });
}
