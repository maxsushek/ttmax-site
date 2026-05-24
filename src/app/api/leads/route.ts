import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

// Very lightweight in-memory rate limit (single instance only).
// In production, use Upstash/Vercel KV/Supabase Edge for proper limiting.
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
    // Supabase not configured — still return success so the lead form works in dev.
    // Real leads are dropped; log so dev sees them.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[leads] (no Supabase) lead:", parsed.data);
    }
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabase.from("leads").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email ?? null,
    source: parsed.data.source,
    locale: parsed.data.locale,
    attribution: parsed.data.attribution ?? {},
  });

 if (error) {
    console.error("[leads] supabase insert error:", error.message, error.code, error.details);
    return NextResponse.json(
      { error: "Database error", details: error.message },
      { status: 500 },
    );
  }
