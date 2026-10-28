"use client";

import type { AttributionData } from "@/types";

const STORAGE_KEY = "ttmax_attribution_v1";
// Поточний візит — у sessionStorage (до закриття вкладки), окремо від першого візиту.
// ⚠️ НАВІЩО: перший візит лежить у localStorage назавжди. 28.10.2026 тестова заявка зі статті
// блогу прийшла з підписом «qr-code / visit-card», бо колись із цього телефона сканували QR —
// менеджер бачив хибне джерело. Перший візит лишаємо (звідки клієнт узявся вперше), а поруч
// пишемо, звідки він прийшов цього разу.
const VISIT_KEY = "ttmax_visit_v1";
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
] as const;

type AttrKey = (typeof ATTRIBUTION_KEYS)[number];

function safeGetStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Capture attribution params from URL on first visit (or fresh paid landing).
 * Persists the first-touch attribution. Updates if a new click ID is present.
 */
function captureVisit(params: URLSearchParams): void {
  let ss: Storage | null = null;
  try {
    ss = window.sessionStorage;
  } catch {
    return;
  }
  if (!ss || ss.getItem(VISIT_KEY)) return;
  // Реферер — лише зовнішній: перехід усередині сайту не є джерелом.
  let referrer: string | undefined;
  try {
    const r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.hostname !== window.location.hostname) referrer = document.referrer;
  } catch {
    /* битий реферер — без нього */
  }
  const visit: Partial<AttributionData> = {
    visit_landing: window.location.pathname,
    visit_referrer: referrer,
    visit_utm_source: params.get("utm_source") || undefined,
    visit_utm_medium: params.get("utm_medium") || undefined,
    visit_utm_campaign: params.get("utm_campaign") || undefined,
    visit_gclid: params.get("gclid") || undefined,
    visit_fbclid: params.get("fbclid") || undefined,
  };
  try {
    ss.setItem(VISIT_KEY, JSON.stringify(visit));
  } catch {
    /* ignore quota errors */
  }
}

function getVisit(): Partial<AttributionData> {
  try {
    const raw = window.sessionStorage.getItem(VISIT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Partial<AttributionData>) : {};
  } catch {
    return {};
  }
}

export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  captureVisit(params);
  const storage = safeGetStorage();
  if (!storage) return;

  const captured: Partial<AttributionData> = {};

  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) captured[key as AttrKey] = value;
  }

  if (Object.keys(captured).length === 0) {
    // No new params — only ensure landing_page is set if first ever visit
    const existing = storage.getItem(STORAGE_KEY);
    if (!existing) {
      const seed: AttributionData = {
        landing_page: window.location.pathname,
        referrer: document.referrer || undefined,
        captured_at: new Date().toISOString(),
      };
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(seed));
      } catch {
        // ignore quota errors
      }
    }
    return;
  }

  const next: AttributionData = {
    ...captured,
    landing_page: window.location.pathname,
    referrer: document.referrer || undefined,
    captured_at: new Date().toISOString(),
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function getAttribution(): AttributionData {
  if (typeof window === "undefined") return {};
  const visit = getVisit();
  const storage = safeGetStorage();
  if (!storage) return { ...visit };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    const first = parsed && typeof parsed === "object" ? (parsed as AttributionData) : {};
    return { ...first, ...visit };
  } catch {
    return { ...visit };
  }
}
