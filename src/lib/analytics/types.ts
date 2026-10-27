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
  | { name: "phone_click"; params?: { location: string; product_slug?: string; product?: string } }
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
  | { name: "conversion"; params: { type: "lead" | "purchase"; value?: number } }
  // Кроки всередині оформлення (назви — як у GA4: add_shipping_info / add_payment_info).
  | { name: "add_shipping_info"; params: EcommerceParams & { shippingTier: string } }
  | { name: "add_payment_info"; params: EcommerceParams & { paymentType: string } }
  // Помилки валідації: лише назви полів, без введених значень.
  | { name: "checkout_error"; params: { step: number; fields: string; count: number } }
  | { name: "order_failed"; params: { reason: string } }
  // Картка товару.
  | { name: "select_variant"; params: { product_slug: string; option: string; value: string } }
  | {
      name: "gallery_navigate";
      params: { method: "arrow" | "swipe" | "thumb" | "key"; index: number; count: number };
    }
  // Каталог.
  | { name: "filter_apply"; params: { filter: string; value: string; active: boolean } }
  | { name: "sort_change"; params: { sort: string } }
  | {
      name: "view_item_list";
      params: { list: string; items_count: number; filters_active: number };
    }
  | { name: "select_item"; params: { list: string; product_slug: string; position: number } };

export type EventName = AnalyticsEvent["name"];

// Minimal global typings for window analytics globals; safe to import anywhere.
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
