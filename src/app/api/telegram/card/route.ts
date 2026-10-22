// POST /api/telegram/card — надіслати в робочий чат картку замовлення (TT-…) чи заявки (Z-…).
// Для замовлень, внесених вручну (продаж наживо): картка приходить як звичайна — з кнопками
// статусів і «⭐ Посилання на відгук».
//
// Доступ — заголовок x-setup-key (той самий секрет, що й /api/telegram/setup).
import { NextResponse, type NextRequest } from "next/server";
import { checkTelegramSecret } from "@/lib/reviews/secret";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendCardByNumber } from "@/lib/telegram/cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!checkTelegramSecret(request.headers.get("x-setup-key"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let refs: string[] = [];
  try {
    const body = (await request.json()) as { refs?: unknown };
    refs = Array.isArray(body.refs) ? body.refs.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }
  refs = refs.filter((r) => /^(TT|Z)-\d{8}-\d{3,}$/.test(r)).slice(0, 20);
  const sb = getSupabaseServerClient({ useServiceRole: true });
  if (!sb || refs.length === 0) return NextResponse.json({ ok: false, error: "nothing" }, { status: 400 });

  const result: Record<string, boolean> = {};
  for (const ref of refs) result[ref] = await sendCardByNumber(sb, ref);
  return NextResponse.json({ ok: Object.values(result).every(Boolean), result });
}
