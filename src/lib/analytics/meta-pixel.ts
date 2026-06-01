export function fbqTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params);
}

// Маппінг наших подій у стандартні події Meta Pixel.
export function metaEventName(name: string): string | null {
  switch (name) {
    case "view_item":
      return "ViewContent";
    case "add_to_cart":
      return "AddToCart";
    case "begin_checkout":
      return "InitiateCheckout";
    case "purchase":
      return "Purchase";
    case "lead_form_submit":
      return "Lead";
    default:
      return null;
  }
}
