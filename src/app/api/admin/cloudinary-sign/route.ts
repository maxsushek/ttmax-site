// src/app/api/admin/media/route.ts
// CRUD ссылок на изображения в Supabase (entity_media). Только для админа.
// POST/DELETE инвалидируют кеш витрины тегом MEDIA_TAG — фото появляется/исчезает без передеплоя.
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { destroyImage } from "@/lib/cloudinary/server";
import { MEDIA_TAG } from "@/lib/media/get";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["product", "category", "brand"] as const;

function db(): SupabaseClient | null {
  const c = getSupabaseServerClient({ useServiceRole: true });
  return c ? (c as unknown as SupabaseClient) : null;
}

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const slug = url.searchParams.get("slug") ?? "";

  const d = db();
  if (!d) return NextResponse.json({ items: [] });

  const { data } = await d
    .from("entity_media")
    .select("*")
    .eq("entity_type", type)
    .eq("entity_slug", slug)
    .order("sort", { ascending: true });

  return NextResponse.json({ items: data ?? [] });
}

const SaveSchema = z.object({
  type: z.enum(TYPES),
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  publicId: z.string().min(3).max(300),
  format: z.string().max(10).optional().nullable(),
  width: z.number().int().positive().max(20000).optional().nullable(),
  height: z.number().int().positive().max(20000).optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
});

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
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = db();
  if (!d) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const data = parsed.data;
  const { count } = await d
    .from("entity_media")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", data.type)
    .eq("entity_slug", data.slug);

  const { data: row, error } = await d
    .from("entity_media")
    .insert({
      entity_type: data.type,
      entity_slug: data.slug,
      public_id: data.publicId,
      format: data.format ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      alt: data.alt ?? null,
      sort: count ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "DB error", message: error.message }, { status: 500 });
  }

  revalidateTag(MEDIA_TAG);
  return NextResponse.json({ ok: true, item: row });
}

const DeleteSchema = z.object({ id: z.string().uuid(), publicId: z.string().min(3) });

export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = DeleteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const d = db();
  if (!d) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  await destroyImage(parsed.data.publicId);
  const { error } = await d.from("entity_media").delete().eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  revalidateTag(MEDIA_TAG);
  return NextResponse.json({ ok: true });
}
