// Один товар у структурі ecommerce (внутрішнє представлення).
export type AnalyticsItem = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
};

// Спільні параметри ecommerce-подій (GA4: currency + value + items).
type EcommerceParams = { currency: string; value: number; items: AnalyticsItem[] };
// Покупка додатково має id транзакції та доставку.
type PurchaseParams = EcommerceParams & { transactionId: string; shipping?: number };

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
  | { name: "view_item"; params: EcommerceParams }
  | { name: "add_to_cart"; params: EcommerceParams }
  | { name: "remove_from_cart"; params: EcommerceParams }
  | { name: "view_cart"; params: EcommerceParams }
  | { name: "begin_checkout"; params: EcommerceParams }
  | { name: "purchase"; params: PurchaseParams }
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
