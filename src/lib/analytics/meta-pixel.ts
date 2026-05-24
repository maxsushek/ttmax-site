export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export function fbqTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
  window.fbq("track", event, params);
}

// Mapping our internal event names to Meta standard events
export function metaEventName(name: string): string | null {
  switch (name) {
    case "lead_form_submit":
      return "Lead";
    case "add_to_cart":
      return "AddToCart";
    case "view_cart":
      return "ViewCart";
    case "begin_checkout":
      return "InitiateCheckout";
    case "purchase":
      return "Purchase";
    default:
      return null;
  }
}
