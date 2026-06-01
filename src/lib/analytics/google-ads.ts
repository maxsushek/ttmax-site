import { getAnalyticsIds } from "./runtime";

export function gtagConversion(value?: number, currency: string = "UAH"): void {
  if (typeof window === "undefined" || !window.gtag) return;
  const { adsId, adsLabel } = getAnalyticsIds();
  if (!adsId || !adsLabel) return;
  window.gtag("event", "conversion", {
    send_to: `${adsId}/${adsLabel}`,
    value: value ?? 0,
    currency,
  });
}
