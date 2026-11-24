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
  // Помилки валідації після «Далі»: лише назви полів, без введених значень. shipping_tier —
  // обраний спосіб доставки (та сама назва, що в add_shipping_info): без нього не було
  // видно, що помилку «Відділення НП» давав самовивіз.
  | {
      name: "checkout_error";
      params: { step: number; fields: string; count: number; shipping_tier?: string };
    }
  // Помилка формату в полі, щойно з нього вийшли (раз на поле): «Далі» могли й не натиснути.
  // ⚠️ Окрема подія, а не checkout_error — інакше ряд checkout_error до й після не порівняти.
  | { name: "checkout_field_error"; params: { field: string; shipping_tier: string } }
  // Закрили оформлення без замовлення: крок і назви заповнених полів (без значень).
  | { name: "checkout_close"; params: { step: number; shipping_tier: string; filled: string } }
  // Оформлення відкрили знову, і введене раніше підставилось із чернетки (lib/checkout/draft.ts):
  // назви відновлених полів, без значень.
  | { name: "checkout_draft_restored"; params: { filled: string } }
  | { name: "order_failed"; params: { reason: string } }
  // Клік по товару в кошику (фото або назва) — перехід на картку.
  | { name: "cart_item_click"; params: { product_slug: string } }
  // Картка товару.
  // variant_value дублює value: у PostHog «value» вже числове (сума в e-commerce подіях), тож
  // рядкове значення там читається як null. Нові запити — по variant_value.
  | {
      name: "select_variant";
      params: { product_slug: string; option: string; value: string; variant_value?: string };
    }
  // Натиснули «купити», не обравши обов'язковий варіант (розмір одягу чи взуття).
  | { name: "variant_required"; params: { product_slug: string; option: string } }
  | {
      name: "gallery_navigate";
      params: { method: "arrow" | "swipe" | "thumb" | "key"; index: number; count: number };
    }
  // Каталог.
  | { name: "filter_apply"; params: { filter: string; value: string; active: boolean } }
  // Розкриті інформаційні блоки (доставка й оплата на картці).
  | { name: "info_expand"; params: { block: string } }
  // Клік зі статті блогу: kind = rec | link | related | post.
  | { name: "blog_link_click"; params: { post: string; kind: string; href: string } }
  | { name: "sort_change"; params: { sort: string } }
  | {
      name: "view_item_list";
      params: { list: string; items_count: number; filters_active: number };
    }
  | { name: "select_item"; params: { list: string; product_slug: string; position: number } }
  /**
   * ШІ-агент у браузері викликав інструмент WebMCP (lib/webmcp/tools.ts, форма консультації).
   * ⚠️ Лише назва інструмента й підсумок. Текст запиту агента й значення полів сюди НЕ додавати:
   * у них може бути що завгодно з розмови користувача, зокрема персональні дані.
   * outcome: ok — є результат; empty — пошук нічого не знайшов; error — помилка;
   * filled — агент заповнив форму (чекає на людину); submitted — людина її відправила.
   */
  | {
      name: "webmcp_tool_call";
      params: { tool: string; outcome: "ok" | "empty" | "error" | "filled" | "submitted" };
    };

export type EventName = AnalyticsEvent["name"];

// Minimal global typings for window analytics globals; safe to import anywhere.
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
