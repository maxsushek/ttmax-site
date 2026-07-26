// src/app/api/admin/content/route.ts
// Контентний шар: читання однієї записи (для редактора) та збереження. Лише адмін.
// Порожній блок (усі поля пусті) → рядок видаляється. POST інвалідує кеш тегом CONTENT_TAG.
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_TAG } from "@/lib/content/get";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db(): SupabaseClient | null {
  const c = getSupabaseServerClient({ useServiceRole: true });
  return c ? (c as unknown as SupabaseClient) : null;
}

const ENTITY = ["product", "category", "brand", "brandCategory", "series", "facet"] as const;
const LOCALE = ["ua", "ru"] as const;

const SaveSchema = z.object({
  entityType: z.enum(ENTITY),
  slug: z.string().min(1).max(160),
  locale: z.enum(LOCALE),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(400).optional(),
  intro: z.string().max(2000).optional(),
  body: z.string().max(20000).optional(),
  faq: z
    .array(z.object({ q: z.string().max(300), a: z.string().max(2000) }))
    .max(30)
    .optional(),
  comparison: z.unknown().optional(),
  noindex: z.boolean().optional(),
});

function clean(s: string | undefined): string | null {
  const v = (s ?? "").trim();
  return v ? v : null;
}

/**
 * Гард префікса локалі у внутрішніх лінках контенту.
 *
 * Історія: у 9 категорій/серій накопичилось 176 лінків на неіснуючий префікс `/uk/`
 * (94 markdown `](/uk/…)` у body + 82 `"href": "/uk/…"` у comparison). Кожен віддавав 308
 * на `/ua/…`, тобто money-гілка мала 88 redirect-хопів на живих сторінках, а контекстні
 * анкори («Dignics», «Tenergy») з'їдалися редиректом.
 *
 * ⚠️ СВІДОМО кидаємо помилку, а НЕ нормалізуємо тихо: автозаміна префікса на поточну локаль
 * мовчки перебила б навмисні крос-локальні лінки (напр. посилання з /ua на /ru-версію).
 * Редактор має побачити конкретний URL і виправити його сам.
 *
 * Дозволені префікси — рівно ті, що є в URL сайту: /ua/ і /ru/.
 */
const LOCALE_PREFIX_RE = /(?:\]\(|"|')(\/([a-z]{2})\/[^)"'\s]*)/g;
const ALLOWED_PREFIXES = new Set(["ua", "ru"]);

function badLocaleLinks(...texts: Array<string | null | undefined>): string[] {
  const bad = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    for (const m of t.matchAll(LOCALE_PREFIX_RE)) {
      const url = m[1];
      const prefix = m[2];
      if (url && prefix && !ALLOWED_PREFIXES.has(prefix)) bad.add(url);
    }
  }
  return [...bad];
}

/** Нормалізуємо comparison у { columns, rows, heading?, note? } або null. */
function normComparison(v: unknown): unknown | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const rows = Array.isArray(o.rows) ? o.rows : [];
  if (!rows.length) return null;
  return v;
}

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const locale = searchParams.get("locale") ?? "";
  if (!entityType || !slug || !locale) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const d = db();
  if (!d) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data, error } = await d
    .from("content_blocks")
    .select("meta_title, meta_description, intro, body, faq, comparison, noindex")
    .eq("entity_type", entityType)
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: "DB error", message: error.message }, { status: 500 });

  return NextResponse.json({ row: data ?? null });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const p = parsed.data;

  const d = db();
  if (!d) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const meta_title = clean(p.metaTitle);
  const meta_description = clean(p.metaDescription);
  const intro = clean(p.intro);
  const body = clean(p.body);
  const faq = p.faq?.filter((f) => f.q.trim() && f.a.trim()) ?? [];
  const comparison = normComparison(p.comparison);
  const noindex = p.noindex === true;

  // Гард префікса локалі — див. badLocaleLinks(). Перевіряємо всі текстові поля + comparison.
  const bad = badLocaleLinks(
    intro,
    body,
    JSON.stringify(faq),
    comparison ? JSON.stringify(comparison) : null,
  );
  if (bad.length > 0) {
    return NextResponse.json(
      {
        error: "Bad locale prefix",
        message: `Внутрішні лінки мають починатися з /ua/ або /ru/. Виправте: ${bad.slice(0, 5).join(", ")}${bad.length > 5 ? ` (ще ${bad.length - 5})` : ""}`,
        urls: bad,
      },
      { status: 400 },
    );
  }

  const empty =
    !meta_title &&
    !meta_description &&
    !intro &&
    !body &&
    faq.length === 0 &&
    !comparison &&
    !noindex;

  if (empty) {
    const { error } = await d
      .from("content_blocks")
      .delete()
      .eq("entity_type", p.entityType)
      .eq("slug", p.slug)
      .eq("locale", p.locale);
    if (error)
      return NextResponse.json({ error: "DB error", message: error.message }, { status: 500 });
    revalidateTag(CONTENT_TAG);
    return NextResponse.json({ ok: true, deleted: true });
  }

  const { error } = await d.from("content_blocks").upsert(
    {
      entity_type: p.entityType,
      slug: p.slug,
      locale: p.locale,
      meta_title,
      meta_description,
      intro,
      body,
      faq: faq.length ? faq : null,
      comparison,
      noindex,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,slug,locale" },
  );
  if (error)
    return NextResponse.json({ error: "DB error", message: error.message }, { status: 500 });

  revalidateTag(CONTENT_TAG);
  return NextResponse.json({ ok: true });
}
