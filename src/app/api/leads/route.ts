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
  console.log("[leads] === START ===");
  console.log("[leads] env URL set:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("[leads] env URL prefix:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40));
  console.log("[leads] env SERVICE_ROLE set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("[leads] env SERVICE_ROLE length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
  console.log("[leads] env SERVICE_ROLE prefix:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  if (isLimited(ip)) {
    console.log("[leads] rate limited");
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    console.log("[leads] invalid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[leads] body keys:", Object.keys(json as object));

  const parsed = LeadSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[leads] validation failed:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  console.log("[leads] validation OK, name:", parsed.data.name, "source:", parsed.data.source, "locale:", parsed.data.locale);

  const supabase = getSupabaseServerClient({ useServiceRole: true });
  console.log("[leads] supabase client:", supabase ? "CREATED" : "NULL");

  if (!supabase) {
    console.error("[leads] supabase client is null — check env vars");
    return NextResponse.json({ ok: true, persisted: false, reason: "no-client" });
  }

  console.log("[leads] attempting insert...");
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      source: parsed.data.source,
      locale: parsed.data.locale,
      attribution: parsed.data.attribution ?? {},
    })
    .select();

  if (error) {
    console.error("[leads] INSERT ERROR:", error.message, "| code:", error.code, "| details:", error.details, "| hint:", error.hint);
    return NextResponse.json(
      { error: "Database error", details: error.message, code: error.code },
      { status: 500 },
    );
  }

  console.log("[leads] INSERT OK, rows returned:", data?.length, "data:", JSON.stringify(data));
  console.log("[leads] === END ===");
  return NextResponse.json({ ok: true, persisted: true });
}
