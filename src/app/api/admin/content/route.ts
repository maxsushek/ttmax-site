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
const LOCALE = ["uk", "ru"] as const;

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
