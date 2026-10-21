// POST /api/reviews — новий відгук (про товар або про магазин).
//
// Порядок: ліміт запитів → схема → антиспам → товар існує → «Покупець» (посилання або
// телефон) → запис зі статусом pending → повідомлення в Telegram з кнопками.
// Публікує ЛИШЕ модератор: звідси відгук ніколи не стає approved.
import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getProductBySlug } from "@/data/catalog";
import { isWithdrawn } from "@/lib/catalog/hidden";
import { locales, localeToLang } from "@/i18n/config";
import { ipHash, isReviewsConfigured, verifyInvite } from "@/lib/reviews/secret";
import { checkSpam } from "@/lib/reviews/spam";
import { findOrder, findPurchase, normalizePhone, type OrderInfo } from "@/lib/reviews/purchase";
import { reviewSlugFor } from "@/lib/reviews/data";
import { sendForModeration } from "@/lib/reviews/moderation";
import type { ReviewRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+\n/g, "\n").trim();

const ReviewSchema = z.object({
  kind: z.enum(["product", "store"]),
  productSlug: z.string().max(160).optional().nullable(),
  locale: z.enum(locales),
  rating: z.number().int().min(1).max(5),
  name: z.string().transform(clean).pipe(z.string().min(2).max(60)),
  city: z
    .string()
    .transform(clean)
    .pipe(z.string().max(60))
    .optional()
    .nullable(),
  body: z.string().transform(clean).pipe(z.string().min(10).max(3000)),
  phone: z.string().max(30).optional().nullable(),
  token: z.string().max(200).optional().nullable(),
  // Антиспам: поле-пастка (людина його не бачить) і час заповнення.
  website: z.string().max(200).optional().nullable(),
  elapsedMs: z.number().int().min(-1).max(86_400_000 * 7).optional().nullable(),
});

/* Пам'ять інстансу — перший бар'єр; справжній ліміт нижче рахується по базі. */
const buckets = new Map<string, { count: number; reset: number }>();
function burstLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.reset < now) {
    buckets.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  b.count += 1;
  return b.count > 4;
}

const fail = (status: number, code: string) => NextResponse.json({ ok: false, error: code }, { status });

export async function POST(request: NextRequest) {
  if (!isReviewsConfigured()) return fail(503, "disabled");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (burstLimited(ip)) return fail(429, "rate");

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail(400, "json");
  }
  const parsed = ReviewSchema.safeParse(json);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json({ ok: false, error: "validation", field: typeof field === "string" ? field : null }, { status: 400 });
  }
  const d = parsed.data;

  // Антиспам. drop — відповідаємо «успіх», щоб бот не дізнався, що його розпізнали.
  const verdict = checkSpam({ honeypot: d.website, elapsedMs: d.elapsedMs, name: d.name, city: d.city, body: d.body });
  if (verdict.kind === "drop") {
    console.warn("[reviews] dropped:", verdict.reason);
    return NextResponse.json({ ok: true, verified: false });
  }
  if (verdict.kind === "reject") return fail(400, "links");

  // Товар: лише той, що є в каталозі й продається; відгуки дублів — на основну картку.
  let productSlug: string | null = null;
  if (d.kind === "product") {
    const p = d.productSlug ? getProductBySlug(d.productSlug) : undefined;
    if (!p || isWithdrawn(p)) return fail(400, "product");
    productSlug = reviewSlugFor(p.slug);
  }

  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb) return fail(503, "db");

  const ipH = ipHash(ip);
  // Ліміт по базі (працює між інстансами): 3 за 10 хв і 8 за добу з одного IP.
  if (ipH) {
    const since = (ms: number) => new Date(Date.now() - ms).toISOString();
    const [{ count: c10 }, { count: c24 }] = await Promise.all([
      sb.from("reviews").select("id", { count: "exact", head: true }).eq("ip_hash", ipH).gte("created_at", since(10 * 60_000)),
      sb.from("reviews").select("id", { count: "exact", head: true }).eq("ip_hash", ipH).gte("created_at", since(86_400_000)),
    ]);
    if ((c10 ?? 0) >= 3 || (c24 ?? 0) >= 8) return fail(429, "rate");
  }

  // Той самий текст повторно — це подвійне натискання або розсилка.
  const { count: dup } = await sb
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("body", d.body)
    .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
  if ((dup ?? 0) > 0) return fail(409, "duplicate");

  // «Покупець»: персональне посилання (номер замовлення в підписі) або телефон.
  const phone = normalizePhone(d.phone);
  if (d.phone && d.phone.trim() && !phone) return fail(400, "phone");
  let order: OrderInfo | null = null;
  let source: ReviewRow["source"] = "form";
  if (d.token) {
    const num = verifyInvite(d.token);
    if (!num) return fail(400, "token");
    order = await findOrder(sb, num);
    if (!order) return fail(400, "token");
    if (productSlug && !order.slugs.includes(productSlug)) return fail(400, "product");
    source = "invite";
  } else if (phone) {
    order = await findPurchase(sb, phone, productSlug);
  }

  const { data: row, error } = await sb
    .from("reviews")
    .insert({
      kind: d.kind,
      product_slug: productSlug,
      locale: localeToLang[d.locale] === "ru" ? "ru" : "uk",
      rating: d.rating,
      author_name: d.name,
      author_city: d.city || null,
      body: d.body,
      phone,
      verified: Boolean(order),
      order_number: order?.orderNumber ?? null,
      source,
      ip_hash: ipH,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      flags: verdict.flags,
    })
    .select("*")
    .single();

  if (error || !row) {
    // 23505 — вже є відгук на цей товар із цього замовлення.
    if (error?.code === "23505") return fail(409, "already");
    console.error("[reviews] insert failed:", error?.message);
    return fail(500, "db");
  }

  after(async () => {
    await sendForModeration(sb, row as ReviewRow);
  });

  return NextResponse.json({ ok: true, verified: Boolean(order) });
}
