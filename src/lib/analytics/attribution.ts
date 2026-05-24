"use client";

import type { AttributionData } from "@/types";

const STORAGE_KEY = "ttmax_attribution_v1";
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
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const storage = safeGetStorage();
  if (!storage) return;

  const params = new URLSearchParams(window.location.search);
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
  const storage = safeGetStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") return parsed as AttributionData;
    return {};
  } catch {
    return {};
  }
}
