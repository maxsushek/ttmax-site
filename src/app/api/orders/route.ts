import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notifyNewOrder } from "@/lib/telegram/notify";
import { getProductBySlug, getMinPrice } from "@/data/catalog";
import { getOverrides, applyOverrides } from "@/lib/catalog/overrides";
import { locales } from "@/i18n/config";

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
    method: z.enum(["apple", "cod", "card"]),
  }),
  items: z.array(OrderItemSchema).min(1).max(50),
  totals: z.object({
    subtotal: z.number().nonnegative().max(10_000_000),
    shipping: z.number().nonnegative().max(10_000),
    total: z.number().positive().max(10_000_000),
  }),
  comment: z.string().max(2000).optional().nullable(),
  agreed: z.boolean(),
  locale: z.enum(locales),
  attribution: z.record(z.string(), z.unknown()).optional(),
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
    if (!product) continue; // не з каталогу — не валідуємо

    const eff = applyOverrides(product, overrides);
    const variant = eff.variants.find(
      (v) => `${eff.slug}__${v.thickness}__${v.color}` === it.productId,
    );
    const expected =
      variant && typeof variant.price === "number"
        ? variant.price
        : typeof eff.priceFrom === "number"
          ? eff.priceFrom
          : (getMinPrice(eff) ?? null);

    if (expected == null) continue; // ціну не визначено в каталозі — пропускаємо

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
  const computedTotal = Math.round((computedSubtotal + data.totals.shipping) * 100) / 100;
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
      locale: data.locale,
      delivery_method: data.delivery.method,
      delivery_city: data.delivery.city ?? null,
      delivery_branch: data.delivery.branch ?? null,
      payment_method: data.payment.method,
      subtotal_uah: computedSubtotal,
      shipping_uah: data.totals.shipping,
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
      locale: data.locale,
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
      shipping: data.totals.shipping,
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
