import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendLeadCard } from "@/lib/telegram/cards";
import { locales, localeToLang } from "@/i18n/config";
import { AttributionSchema } from "@/lib/analytics/attribution-schema";
import {
  attributionProps,
  captureServerEvent,
  posthogContext,
} from "@/lib/analytics/posthog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const phoneRe = /^(\+?380|0)(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/;

const LeadSchema = z.object({
  // Ім'я опційне: швидке замовлення з картки збирає лише телефон (ім'я — бонус).
  name: z.string().trim().min(2).max(120).optional().nullable(),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .refine((v) => phoneRe.test(v), "Invalid Ukrainian phone"),
  email: z.string().email().optional().nullable(),
  source: z.string().max(60),
  locale: z.enum(locales),
  /**
   * ⚠️ Раніше було z.record(z.string(), z.unknown()) — тобто jsonb БУДЬ-ЯКОГО розміру
   * (до платформного ліміту ~4.5 МБ на запит) писався в БД без обмежень. Кілька сотень
   * таких запитів вичерпують квоту Supabase, після чого перестають зберігатись СПРАВЖНІ
   * замовлення. Тепер — білий список ключів + ліміт довжини кожного значення.
   *
   * ⚠️ Список має покривати ВСЕ, що реально пише getAttribution() (attribution.ts:7-16, 51-53)
   * плюс поля, які додають форми (product, productName, productSlug). Забути ключ = тихо
   * втратити атрибуцію реклами, тому нові ключі додавати сюди СИНХРОННО.
   */
  attribution: AttributionSchema.optional(),
  /**
   * Honeypot. ⚠️ Раніше перевірка жила ТІЛЬКИ в браузері (QuickOrder.tsx:122 `if (honey) return`),
   * і поле навіть не надсилалось — тобто прямий POST обходив її повністю.
   * Тепер поле їде на сервер: заповнене = бот, відповідаємо 200 «ок» без запису (мовчазне
   * відхилення, щоб бот не підбирав обхід).
   */
  company: z.string().max(200).optional(),
  /**
   * Склад кошика для «Замовити в 1 клік» з кошика (source="cart-quick-order").
   * Ліміти жорсткі з тієї ж причини, що й в attribution: без них можна залити БД сміттям.
   * Ціни — з браузера, тобто довідкові: менеджер підтверджує їх у дзвінку.
   */
  cart: z
    .object({
      items: z
        .array(
          z.object({
            name: z.string().trim().min(1).max(160),
            // Сторінка товару — для фото в Telegram. Формат slug каталогу, нічого іншого.
            slug: z
              .string()
              .regex(/^[a-z0-9-]{1,120}$/)
              .optional(),
            qty: z.number().int().min(1).max(99),
            price: z.number().min(0).max(1_000_000),
          }),
        )
        .min(1)
        .max(30),
      total: z.number().min(0).max(10_000_000),
    })
    .optional(),
});

/** Склад кошика одним текстом — у leads.notes (його показують CRM і картка в Telegram). */
function cartNotes(cart: NonNullable<z.infer<typeof LeadSchema>["cart"]>): string {
  const uah = (n: number) => `${new Intl.NumberFormat("uk-UA").format(n)} грн`;
  const lines = cart.items.map((i) => `• ${i.name} ×${i.qty} — ${uah(i.price * i.qty)}`);
  return [`Кошик (ціни з сайту):`, ...lines, `Разом: ${uah(cart.total)}`].join("\n");
}

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

  const parsed = LeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot спрацював — це бот. Відповідаємо як на успіх і НІЧОГО не пишемо:
  // мовчазне відхилення не дає боту зрозуміти, що його відсіяли, і підбирати обхід.
  if (parsed.data.company && parsed.data.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseServerClient({ useServiceRole: true });
  if (!supabase) {
    console.error("[leads] supabase client unavailable");
    return NextResponse.json({ ok: true, persisted: false });
  }

  // leads.name — NOT NULL. Якщо клієнт не дав ім'я (швидке замовлення), кладемо
  // локалізовану заглушку, щоб у CRM рядок читався (сам запит — у source + attribution).
  const name =
    parsed.data.name?.trim() ||
    (parsed.data.locale === "ru" ? "Быстрый заказ" : "Швидке замовлення");
  // Товар зі швидкого замовлення лежить в attribution (product, productSlug) — картка в Telegram
  // бере його звідти сама (lib/telegram/cards.ts).
  const attribution = parsed.data.attribution ?? {};
  // ⚠️ БД має CHECK (locale IN ('uk','ru')) — це BCP-47 код мови, а НЕ код локалі в URL
  // ('ua'/'ru'). Без мапи вставка з locale='ua' падала (23514) → форма лідів на /ua ламалась.
  // Каст: рукописний тип колонки в supabase/types.ts помилково каже "ua"|"ru", а фактично
  // (і в наявних рядках) — "uk". Значення коректне для БД; тип лишаємо не чіпати (він
  // спільний з іншими таблицями, де 'ua' валідний).
  const dbLocale = localeToLang[parsed.data.locale] as "ua" | "ru";

  const { data: leadRow, error } = await supabase
    .from("leads")
    .insert({
      name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      source: parsed.data.source,
      locale: dbLocale,
      // Склад кошика (slug + назва + кількість) — у attribution.cart_items: звідти картка в
      // Telegram бере фото товарів. Пишемо вже ПРОВАЛІДОВАНЕ (zod вище), а не сирий ввід.
      attribution: parsed.data.cart
        ? {
            ...attribution,
            cart_items: parsed.data.cart.items
              .filter((i) => i.slug)
              .map((i) => ({ slug: i.slug, name: i.name, qty: i.qty })),
          }
        : attribution,
      ...(parsed.data.cart
        ? { notes: cartNotes(parsed.data.cart), value_uah: Math.round(parsed.data.cart.total) }
        : {}),
    })
    .select("id, lead_number")
    .single();

  if (error) {
    console.error("[leads] insert error:", error.message, error.code);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Telegram: картка заявки (lib/telegram/cards.ts) з кнопками статусів; помилки не валять запит.
  const leadId = leadRow?.id ?? null;
  if (leadId) {
    after(async () => {
      try {
        await sendLeadCard(supabase, leadId);
      } catch (err) {
        console.error("[leads] telegram card failed:", err instanceof Error ? err.message : err);
      }
    });
  }

  // PostHog: заявка (консультація / швидке замовлення). Без імені й телефону.
  if (leadRow?.lead_number) {
    const ph = posthogContext(request);
    const leadNumber = leadRow.lead_number;
    after(() =>
      captureServerEvent(
        ph,
        "lead_created",
        {
          lead_number: leadNumber,
          source: parsed.data.source,
          locale: parsed.data.locale,
          product: attribution.productName ?? attribution.product,
          product_slug: attribution.productSlug,
          ...(parsed.data.cart
            ? {
                value: parsed.data.cart.total,
                currency: "UAH",
                items_count: parsed.data.cart.items.reduce((n, i) => n + i.qty, 0),
              }
            : {}),
          ...attributionProps(attribution),
        },
        `lead:${leadNumber}`,
      ),
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
