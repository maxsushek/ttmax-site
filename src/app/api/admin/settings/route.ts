// src/app/api/admin/settings/route.ts
// Збереження лічильників у site_settings. Лише для адміна.
// Порожнэ значення видаляэ рядок (фолбэк на env). POST інвалідуэ кеш тегом.
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SETTINGS_TAG } from "@/lib/settings/get";
import { COUNTER_KEYS } from "@/lib/analytics/ids";
import { CONTACT_KEYS } from "@/lib/contact/get";
import { HOME_KEY_VALUES } from "@/lib/homepage/keys";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>([
  ...Object.values(COUNTER_KEYS),
  ...Object.values(CONTACT_KEYS),
  ...HOME_KEY_VALUES,
]);

function db(): SupabaseClient | null {
  const c = getSupabaseServerClient({ useServiceRole: true });
  return c ? (c as unknown as SupabaseClient) : null;
}

const SaveSchema = z.object({
  // Значення site_settings — короткий текст; 500 з запасом покриває підзаголовки головної.
  settings: z.record(z.string(), z.string().max(500)),
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
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const d = db();
  if (!d) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const now = new Date().toISOString();
  for (const [key, raw] of Object.entries(parsed.data.settings)) {
    if (!ALLOWED.has(key)) continue;
    const value = raw.trim();
    if (value) {
      const { error } = await d
        .from("site_settings")
        .upsert({ key, value, updated_at: now }, { onConflict: "key" });
      if (error) {
        return NextResponse.json({ error: "DB error", message: error.message }, { status: 500 });
      }
    } else {
      await d.from("site_settings").delete().eq("key", key);
    }
  }

  revalidateTag(SETTINGS_TAG);
  return NextResponse.json({ ok: true });
}
