// src/lib/content/get.ts
// Резолвер контентного шару (таблиця content_blocks).
// Кеш — на КЛЮЧ (entity_type+slug+locale), інвалідація одним тегом при збереженні в адмінці (без передеплою).
// Це масштабовано: тягнемо лише потрібний рядок, а не всю таблицю.
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";

export const CONTENT_TAG = "content-blocks";

/** Типи сутностей, до яких можна привʼязати опис. Поле відкрите — легко додати нові. */
export type ContentEntityType =
  | "product"
  | "category"
  | "brand"
  | "brandCategory"
  | "series"
  | "facet";
export const CONTENT_ENTITY_TYPES: ContentEntityType[] = [
  "product",
  "category",
  "brand",
  "brandCategory",
  "series",
  "facet",
];

export type ContentFaq = { q: string; a: string };

export type ContentComparison = {
  heading?: string;
  /** Заголовки колонок таблиці порівняння. */
  columns: string[];
  /** Рядки; якщо є href — перша клітинка стає посиланням на альтернативу (внутрішня перелінковка). */
  rows: { cells: string[]; href?: string }[];
  note?: string;
};

export type ContentBlock = {
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  body?: string;
  faq?: ContentFaq[];
  comparison?: ContentComparison;
  noindex?: boolean;
};

function db(): SupabaseClient | null {
  const c = getSupabaseServerClient({ useServiceRole: true });
  return c ? (c as unknown as SupabaseClient) : null;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function asFaq(v: unknown): ContentFaq[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: ContentFaq[] = [];
  for (const item of v) {
    if (item && typeof item === "object") {
      const q = str((item as Record<string, unknown>).q);
      const a = str((item as Record<string, unknown>).a);
      if (q && a) out.push({ q, a });
    }
  }
  return out.length ? out : undefined;
}

function asComparison(v: unknown): ContentComparison | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const columns = Array.isArray(o.columns)
    ? o.columns.filter((c): c is string => typeof c === "string")
    : [];
  const rowsRaw = Array.isArray(o.rows) ? o.rows : [];
  const rows: ContentComparison["rows"] = [];
  for (const r of rowsRaw) {
    if (r && typeof r === "object") {
      const cells = Array.isArray((r as Record<string, unknown>).cells)
        ? ((r as Record<string, unknown>).cells as unknown[]).filter(
            (c): c is string => typeof c === "string",
          )
        : [];
      if (cells.length) {
        const href = str((r as Record<string, unknown>).href);
        rows.push(href ? { cells, href } : { cells });
      }
    }
  }
  if (!rows.length) return undefined;
  const heading = str(o.heading);
  const note = str(o.note);
  const cmp: ContentComparison = { columns, rows };
  if (heading) cmp.heading = heading;
  if (note) cmp.note = note;
  return cmp;
}

type Row = Record<string, unknown>;

function mapRow(row: Row): ContentBlock {
  const block: ContentBlock = {};
  const metaTitle = str(row.meta_title);
  const metaDescription = str(row.meta_description);
  const intro = str(row.intro);
  const body = str(row.body);
  const faq = asFaq(row.faq);
  const comparison = asComparison(row.comparison);
  if (metaTitle) block.metaTitle = metaTitle;
  if (metaDescription) block.metaDescription = metaDescription;
  if (intro) block.intro = intro;
  if (body) block.body = body;
  if (faq) block.faq = faq;
  if (comparison) block.comparison = comparison;
  if (row.noindex === true) block.noindex = true;
  return block;
}

async function load(
  entityType: ContentEntityType,
  slug: string,
  locale: Locale,
): Promise<ContentBlock | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("content_blocks")
    .select("meta_title, meta_description, intro, body, faq, comparison, noindex")
    .eq("entity_type", entityType)
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Row);
}

/**
 * Кешований опис для (тип, slug, мова). null — нічого не рендеримо.
 * Кеш на ключ + спільний тег CONTENT_TAG (revalidateTag у адмінці застосовує зміни без передеплою).
 */
export function getContent(
  entityType: ContentEntityType,
  slug: string,
  locale: Locale,
): Promise<ContentBlock | null> {
  return unstable_cache(
    () => load(entityType, slug, locale),
    ["content-block", entityType, slug, locale],
    {
      tags: [CONTENT_TAG],
      revalidate: 3600,
    },
  )();
}
