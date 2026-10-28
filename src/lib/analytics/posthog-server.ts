// src/lib/analytics/posthog-server.ts
// Серверні події PostHog: замовлення, заявки, відгуки.
//
// НАВІЩО З СЕРВЕРА, якщо браузер і так шле purchase: браузерну подію ріже блокувальник реклами
// або обриває закрита вкладка, а сервер бачить КОЖНЕ збережене замовлення. Тому виручка в
// PostHog рахується з order_placed (серверна), а браузерний purchase — для воронки й записів.
//
// Зв'язок із відвідувачем — через cookie posthog-js (анонімний id + id сеансу): серверна подія
// стає в ту саму воронку й той самий запис сеансу. Немає cookie (PostHog заблоковано) — подія
// все одно рахується, але окремо, без воронки.
//
// ⚠️ Без персональних даних: ні імені, ні телефону, ні e-mail, ні адреси. Лише номер,
// суми й товари. Профіль людини не створюється ($process_person_profile: false).
import type { NextRequest } from "next/server";
import { POSTHOG_CAPTURE_URL, POSTHOG_COOKIE, POSTHOG_TOKEN } from "@/config/posthog";

export type PosthogContext = {
  distinctId: string | null;
  sessionId: string | null;
  /** Сторінка, з якої надіслано форму, — без query (там може бути токен запрошення). */
  url: string | null;
};

/** Читати синхронно в обробнику, до after(). */
export function posthogContext(request: NextRequest): PosthogContext {
  let distinctId: string | null = null;
  let sessionId: string | null = null;
  const raw = request.cookies.get(POSTHOG_COOKIE)?.value;
  if (raw) {
    for (const candidate of [raw, safeDecode(raw)]) {
      try {
        const j = JSON.parse(candidate) as { distinct_id?: unknown; $sesid?: unknown };
        if (typeof j.distinct_id === "string" && j.distinct_id.length <= 200) distinctId = j.distinct_id;
        if (Array.isArray(j.$sesid) && typeof j.$sesid[1] === "string") sessionId = j.$sesid[1];
        break;
      } catch {
        /* пробуємо декодований варіант */
      }
    }
  }
  let url: string | null = null;
  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const u = new URL(ref);
      url = u.origin + u.pathname;
    } catch {
      /* битий referer — без URL */
    }
  }
  return { distinctId, sessionId, url };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Надіслати подію. Лише з бойового деплою Vercel: прев'ю й локальна розробка мовчать.
 * Помилки не пробрасуємо — аналітика не має ламати замовлення. Викликати в after().
 */
export async function captureServerEvent(
  ctx: PosthogContext,
  event: string,
  properties: Record<string, unknown>,
  /** distinct_id, якщо cookie немає: стабільний для об'єкта (order:TT-…), щоб не плодити «людей». */
  fallbackId: string,
): Promise<void> {
  if (!POSTHOG_TOKEN || process.env.VERCEL_ENV !== "production") return;
  const body = {
    api_key: POSTHOG_TOKEN,
    event,
    distinct_id: ctx.distinctId ?? fallbackId,
    timestamp: new Date().toISOString(),
    properties: {
      ...properties,
      $process_person_profile: false,
      $lib: "ttmax-server",
      ...(ctx.sessionId ? { $session_id: ctx.sessionId } : {}),
      ...(ctx.url ? { $current_url: ctx.url } : {}),
    },
  };
  try {
    const res = await fetch(POSTHOG_CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.warn(`[posthog] ${event}: HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[posthog] ${event}:`, err instanceof Error ? err.message : err);
  }
}

/** UTM і перший вхід — з attribution форми (getAttribution у браузері). */
export function attributionProps(a: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!a) return {};
  const pick = (k: string) => (typeof a[k] === "string" && a[k] ? (a[k] as string) : undefined);
  const out: Record<string, unknown> = {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    first_landing_page: pick("landing_page"),
    first_referrer: pick("referrer"),
    has_gclid: Boolean(pick("gclid")),
    has_fbclid: Boolean(pick("fbclid")),
    // Поточний візит (attribution.ts) — звідки людина прийшла саме цього разу.
    visit_utm_source: pick("visit_utm_source"),
    visit_utm_medium: pick("visit_utm_medium"),
    visit_landing_page: pick("visit_landing"),
    visit_referrer: pick("visit_referrer"),
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}
