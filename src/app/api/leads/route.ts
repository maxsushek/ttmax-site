import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notifyNewLead } from "@/lib/telegram/notify";
import { locales } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const phoneRe = /^(\+?380|0)(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/;

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .refine((v) => phoneRe.test(v), "Invalid Ukrainian phone"),
  email: z.string().email().optional().nullable(),
  source: z.string().max(60),
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

  const parsed = LeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient({ useServiceRole: true });
  if (!supabase) {
    console.error("[leads] supabase client unavailable");
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { data: leadRow, error } = await supabase
    .from("leads")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      source: parsed.data.source,
      locale: parsed.data.locale,
      attribution: parsed.data.attribution ?? {},
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
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      source: parsed.data.source,
      locale: parsed.data.locale,
      adminUrl,
    });
  });

  return NextResponse.json({ ok: true, persisted: true });
}
