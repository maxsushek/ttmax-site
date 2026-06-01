import { pushDataLayer } from "./gtm";
import { fbqTrack, metaEventName } from "./meta-pixel";
import { gtagConversion } from "./google-ads";
import type { AnalyticsEvent, AnalyticsItem } from "./types";

type EcommerceEvent = Extract<
  AnalyticsEvent,
  {
    name:
      | "view_item"
      | "add_to_cart"
      | "remove_from_cart"
      | "view_cart"
      | "begin_checkout"
      | "purchase";
  }
>;

const ECOMMERCE_EVENTS: ReadonlySet<string> = new Set<EcommerceEvent["name"]>([
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "purchase",
]);

function isEcommerce(e: AnalyticsEvent): e is EcommerceEvent {
  return ECOMMERCE_EVENTS.has(e.name);
}

function ga4Items(items: AnalyticsItem[]) {
  return items.map((it) => ({
    item_id: it.id,
    item_name: it.name,
    item_brand: it.brand,
    price: it.price,
    quantity: it.quantity,
  }));
}

/**
 * Єдина точка входу для всіх подій аналітики.
 * Тихо нічого не робить, коли лічильники не налаштовані.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  if (isEcommerce(event)) {
    const p = event.params;
    // GA4 ecommerce через GTM dataLayer
    pushDataLayer({ ecommerce: null }); // очистити попередній ecommerce-об'єкт
    pushDataLayer({
      event: event.name,
      ecommerce: {
        currency: p.currency,
        value: p.value,
        ...(event.name === "purchase"
          ? { transaction_id: event.params.transactionId, shipping: event.params.shipping }
          : {}),
        items: ga4Items(p.items),
      },
    });

    // Meta Pixel — стандартні події з contents
    const fbEvent = metaEventName(event.name);
    if (fbEvent) {
      fbqTrack(fbEvent, {
        content_type: "product",
        content_ids: p.items.map((i) => i.id),
        contents: p.items.map((i) => ({ id: i.id, quantity: i.quantity })),
        value: p.value,
        currency: p.currency,
      });
    }

    if (event.name === "purchase") gtagConversion(event.params.value);
    return;
  }

  // Звичайні (неекомерс) події
  const params = "params" in event && event.params ? event.params : {};
  pushDataLayer({ event: event.name, ...params });

  const fbEvent = metaEventName(event.name);
  if (fbEvent) fbqTrack(fbEvent, params);

  if (event.name === "conversion") gtagConversion(event.params.value);
}
