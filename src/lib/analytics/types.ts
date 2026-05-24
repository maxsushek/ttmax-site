export type AnalyticsEvent =
  | { name: "page_view"; params?: { path: string } }
  | { name: "lead_form_view"; params?: { location: string } }
  | { name: "lead_form_start"; params?: { location: string } }
  | { name: "lead_form_submit"; params?: { location: string } }
  | { name: "cta_click"; params: { cta: string; location: string } }
  | { name: "phone_click"; params?: { location: string } }
  | { name: "email_click"; params?: { location: string } }
  | { name: "whatsapp_click"; params?: { location: string } }
  | { name: "faq_open"; params: { question: string } }
  | { name: "scroll_depth"; params: { depth: 25 | 50 | 75 | 100 } }
  | { name: "add_to_cart"; params: { productId: string; price: number; brand: string } }
  | { name: "remove_from_cart"; params: { productId: string } }
  | { name: "view_cart" }
  | { name: "begin_checkout"; params: { value: number; itemsCount: number } }
  | {
      name: "purchase";
      params: { value: number; orderId: string; itemsCount: number };
    }
  | { name: "conversion"; params: { type: "lead" | "purchase"; value?: number } };

export type EventName = AnalyticsEvent["name"];

// Minimal global typings for window analytics globals; safe to import anywhere.
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
