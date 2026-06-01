// src/app/api/admin/overrides/route.ts
// Збереження переопределень ціни/наявності. Лише адмін.
// Порожнэ переопределення (price=null && inStock=null) видаляэ рядок (повернення до коду).
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_OVERRIDES_TAG } from "@/lib/catalog/overrides";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Item = z.object({
  key: z.string().min(1).max(120),
  price: z.number().positive().max(1_000_000).nullable(),
  inStock: z.boolean().nullable(),
});

const Schema = z.object({ items: z.array(Item).max(1000) });

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const c = getSupabaseServerClient({ useServiceRole: true });
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  const db = c as unknown as SupabaseClient;

  const now = new Date().toISOString();
  for (const it of parsed.data.items) {
    const hasOverride = it.price !== null || it.inStock !== null;
    if (hasOverride) {
      const { error } = await db
        .from("product_overrides")
        .upsert(
          { key: it.key, price: it.price, in_stock: it.inStock, updated_at: now },
          { onConflict: "key" },
        );
      if (error) {
        return NextResponse.json({ error: "DB error", message: error.message }, { status: 500 });
      }
    } else {
      await db.from("product_overrides").delete().eq("key", it.key);
    }
  }

  revalidateTag(PRODUCT_OVERRIDES_TAG);
  return NextResponse.json({ ok: true });
}
