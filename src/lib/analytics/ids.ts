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
