// src/lib/analytics/runtime.ts
// Рантайм-доступ до резолвнутих id лічильників на клієнті.
// AnalyticsProvider встановлює значення (із БД/env), а подієвий шар
// (gtagConversion тощо) читає їх замість build-time констант.
import { EMPTY_ANALYTICS_IDS, type AnalyticsIds } from "./ids";

let current: AnalyticsIds = EMPTY_ANALYTICS_IDS;

export function setAnalyticsIds(ids: AnalyticsIds): void {
  current = ids;
}

export function getAnalyticsIds(): AnalyticsIds {
  return current;
}
