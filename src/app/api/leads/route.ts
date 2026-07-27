import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notifyNewLead } from "@/lib/telegram/notify";
import { locales, localeToLang } from "@/i18n/config";
import { AttributionSchema } from "@/lib/analytics/attribution-schema";

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
  // Товар зі швидкого замовлення передається в attribution.product → показуємо в Telegram.
  const attribution = parsed.data.attribution ?? {};
  const product = typeof attribution.product === "string" ? attribution.product : null;
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
      attribution,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[leads] insert error:", error.message, error.code);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Telegram-сповіщення (no-op без TELEGRAM_*; помилки не валять запит).
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const leadId = leadRow?.id ?? null;
  const adminUrl = host ? `https://${host}/admin/leads${leadId ? `/${leadId}` : ""}` : null;
  after(async () => {
    await notifyNewLead({
      name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      source: parsed.data.source,
      locale: parsed.data.locale,
      product,
      adminUrl,
    });
  });

  return NextResponse.json({ ok: true, persisted: true });
}
