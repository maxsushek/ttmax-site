// POST /api/telegram/setup — разово підключити бота до /api/telegram/webhook.
//
// Навіщо окремий маршрут: токен бота живе лише в env Vercel, і реєструвати webhook
// має сам сайт — так токен нікуди не копіюється. Доступ — заголовок x-setup-key, рівний
// секрету webhook (похідний від REVIEWS_SECRET), тож викликати може лише той, хто знає секрет.
//
// ⚠️ Не перезаписує чужий webhook: якщо бот уже підключений до іншої адреси, відповідає
// 409 і нічого не міняє (інакше тихо зламали б іншу інтеграцію). Перезапис — лише з ?force=1.
import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/config/site";
import { checkTelegramSecret, telegramWebhookSecret } from "@/lib/reviews/secret";
import { isBotConfigured, tg } from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookInfo = { url: string; pending_update_count: number; last_error_message?: string; last_error_date?: number };

export async function POST(request: NextRequest) {
  if (!checkTelegramSecret(request.headers.get("x-setup-key"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isBotConfigured()) return NextResponse.json({ ok: false, error: "bot env missing" }, { status: 503 });

  const target = `${siteConfig.url}/api/telegram/webhook`;
  const before = await tg<WebhookInfo>("getWebhookInfo", {});
  const force = request.nextUrl.searchParams.get("force") === "1";
  if (before?.url && before.url !== target && !force) {
    return NextResponse.json({ ok: false, error: "webhook-in-use", current: before.url }, { status: 409 });
  }

  const set = await tg<boolean>("setWebhook", {
    url: target,
    secret_token: telegramWebhookSecret(),
    allowed_updates: ["message", "callback_query"],
    max_connections: 5,
  });
  // Підказка в меню команд бота.
  await tg("setMyCommands", {
    commands: [
      { command: "status", description: "Кнопки статусів: /status TT-… або /status Z-…" },
      { command: "link", description: "Посилання на відгук: /link TT-…, Z-… або телефон" },
    ],
  });
  const after = await tg<WebhookInfo>("getWebhookInfo", {});
  return NextResponse.json({
    ok: Boolean(set),
    before: before ? { url: before.url || null, pending: before.pending_update_count } : null,
    after: after
      ? { url: after.url || null, pending: after.pending_update_count, lastError: after.last_error_message ?? null }
      : null,
  });
}

/** GET — лише стан (без змін), з тим самим ключем. */
export async function GET(request: NextRequest) {
  if (!checkTelegramSecret(request.headers.get("x-setup-key"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const info = await tg<WebhookInfo>("getWebhookInfo", {});
  return NextResponse.json({
    ok: Boolean(info),
    url: info?.url || null,
    pending: info?.pending_update_count ?? null,
    lastError: info?.last_error_message ?? null,
    lastErrorAt: info?.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
  });
}
