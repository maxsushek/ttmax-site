// src/app/api/poll/route.ts
// Голосування в інтерактивних блоках статей: GET — агреговані результати, POST — голос.
import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { POLLS, getPoll, type PollId } from "@/config/polls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VoteSchema = z.object({
  poll: z.string().max(60),
  option: z.string().max(60),
});

/**
 * ⚠️ Ідентифікатор «виборця» — хеш, а НЕ сама IP-адреса.
 *
 * У БД не повинно лежати нічого, що само по собі вказує на людину: IP — персональні
 * дані, а для дедуплікації голосів достатньо необоротного відбитка. Сіль прив'язана
 * до конкретного опитування, тож один і той самий відвідувач у різних опитуваннях
 * дає різні хеші й зв'язати їх між собою не можна.
 *
 * Це захист від випадкової накрутки (перезавантажив сторінку — проголосував ще раз),
 * а не від цілеспрямованої: зміна IP дає новий голос. Для опитування «хто чим грає»
 * цього достатньо, і городити щось складніше сенсу немає.
 */
function voterHash(req: NextRequest, poll: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`${poll}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

type CountRow = { option_key: string };

/** Порахувати голоси опитування. Порожньо/помилка → нулі, сторінка не має падати через опитування. */
async function tally(db: SupabaseClient, poll: PollId) {
  const counts: Record<string, number> = {};
  for (const o of getPoll(poll).options) counts[o] = 0;

  const { data, error } = await db.from("poll_votes").select("option_key").eq("poll", poll);
  if (error || !data) return { counts, total: 0 };

  for (const row of data as CountRow[]) {
    // Невідомий ключ ігноруємо: якщо варіант приберуть із конфігу, старі голоси
    // не мають ламати підрахунок і не мають зʼявлятись у видачі привидом.
    if (row.option_key in counts) counts[row.option_key] = (counts[row.option_key] ?? 0) + 1;
  }
  return { counts, total: (data as CountRow[]).length };
}

function isPollId(v: string): v is PollId {
  return Object.prototype.hasOwnProperty.call(POLLS, v);
}

export async function GET(req: NextRequest) {
  const poll = req.nextUrl.searchParams.get("poll") ?? "";
  if (!isPollId(poll)) return NextResponse.json({ error: "Unknown poll" }, { status: 400 });

  const client = getSupabaseServerClient({ useServiceRole: true });
  if (!client) return NextResponse.json({ counts: {}, total: 0, voted: null });
  const db = client as unknown as SupabaseClient;

  const { counts, total } = await tally(db, poll);

  // Чи вже голосував саме цей відвідувач — щоб одразу показати результати, а не форму.
  const { data: mine } = await db
    .from("poll_votes")
    .select("option_key")
    .eq("poll", poll)
    .eq("voter", voterHash(req, poll))
    .maybeSingle();

  return NextResponse.json({
    counts,
    total,
    voted: (mine as CountRow | null)?.option_key ?? null,
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { poll, option } = parsed.data;

  if (!isPollId(poll)) return NextResponse.json({ error: "Unknown poll" }, { status: 400 });
  // ⚠️ Варіант звіряємо з БІЛИМ СПИСКОМ у конфігу, а не приймаємо будь-який рядок:
  // інакше підробленим POST можна засипати таблицю довільними ключами.
  if (!getPoll(poll).options.includes(option)) {
    return NextResponse.json({ error: "Unknown option" }, { status: 400 });
  }

  const client = getSupabaseServerClient({ useServiceRole: true });
  if (!client) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const db = client as unknown as SupabaseClient;

  // UPSERT по (poll, voter): повторний запит міняє відповідь, а не додає другий голос.
  const { error } = await db
    .from("poll_votes")
    .upsert(
      { poll, option_key: option, voter: voterHash(req, poll), updated_at: new Date().toISOString() },
      { onConflict: "poll,voter" },
    );
  if (error) return NextResponse.json({ error: "Save failed" }, { status: 500 });

  const { counts, total } = await tally(db, poll);
  return NextResponse.json({ counts, total, voted: option });
}
