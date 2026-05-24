import { pushDataLayer } from "./gtm";
import { fbqTrack, metaEventName } from "./meta-pixel";
import { gtagConversion } from "./google-ads";
import type { AnalyticsEvent } from "./types";

/**
 * Single entry point for all analytics events.
 * No-ops gracefully when no tracking IDs are configured.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  // 1) Push to GTM dataLayer (handles GA4 + most destinations downstream)
  pushDataLayer({
    event: event.name,
    ...("params" in event && event.params ? event.params : {}),
  });

  // 2) Meta Pixel
  const fbEvent = metaEventName(event.name);
  if (fbEvent) {
    fbqTrack(fbEvent, "params" in event && event.params ? event.params : undefined);
  }

  // 3) Google Ads conversion firing (lead + purchase)
  if (event.name === "conversion") {
    gtagConversion(event.params.value);
  }
  if (event.name === "purchase") {
    gtagConversion(event.params.value);
  }
}
