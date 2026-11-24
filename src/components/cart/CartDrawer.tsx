"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/utils/format";
import { t } from "@/i18n";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY, toAnalyticsItems } from "@/lib/analytics/ecommerce";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { QuickOrder } from "@/components/catalog/QuickOrder";
import { phFeatureFlag } from "@/lib/analytics/posthog";
import { slugFromProductId } from "@/lib/catalog/product-url";
import { cartItemPath, splitCartModel } from "@/lib/cart/line";
import { COD_ONLY } from "@/config/payment";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

type Props = {
  messages: Messages;
  locale: Locale;
  logoUrl?: string;
};

export function CartDrawer({ messages, locale, logoUrl }: Props) {
  const cart = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // «Замовити в 1 клік» з кошика (28.10.2026). Вимикач — флаг PostHog `cart-one-click`:
  // показуємо за замовчуванням, ховаємо лише якщо флаг явно вимкнений. Так кнопку можна
  // прибрати без деплою, якщо заявки з неї не перетворюються на продажі.
  const [oneClick, setOneClick] = useState(true);
  useEffect(() => {
    phFeatureFlag("cart-one-click", (on) => {
      if (on === false) setOneClick(false);
    });
  }, []);

  const m = messages.cart;

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(cart.isOpen, panelRef, { onEscape: cart.close });

  const goCheckout = () => {
    trackEvent({
      name: "begin_checkout",
      params: { currency: CURRENCY, value: cart.total, items: toAnalyticsItems(cart.items) },
    });
    cart.close();
    setCheckoutOpen(true);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={cart.close}
        className={cn(
          "fixed inset-0 z-[700] bg-black/65 backdrop-blur-sm transition-opacity duration-300",
          cart.isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Drawer */}
      {/* ⚠️ НАВІЩО <div> + inert: див. коментар у layout/MobileMenu.tsx (ARIA: role="dialog"
          не можна ставити на <aside>; закрита шухляда не має бути в дереві доступності). */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={m.title}
        tabIndex={-1}
        inert={!cart.isOpen}
        className={cn(
          "fixed bottom-0 right-0 top-0 z-[810] flex w-full max-w-[420px] flex-col outline-none",
          "border-l border-border-subtle bg-[#0A0C12]",
          "transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
          cart.isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="text-xl">
              🛒
            </span>
            <h2 className="font-display text-lg font-black uppercase tracking-[0.04em]">
              {m.title}
            </h2>
            {cart.count > 0 && (
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-extrabold text-accent">
                {t(m.itemsCount, { count: cart.count })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={cart.close}
            aria-label={messages.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-white/[0.06] text-base text-ink-dim transition-colors hover:bg-danger/15 hover:text-danger"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Free shipping bar */}
        {cart.count > 0 && !cart.hasFreeShip && (
          <div className="shrink-0 border-b border-border-subtle bg-accent/[0.04] px-5 py-3">
            <div className="mb-1 flex justify-between">
              <span className="font-body text-xs text-ink-muted">{m.freeShipFrom}</span>
              <span className="font-display text-xs font-bold text-accent">
                {formatPrice(cart.freeShipRemaining)}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-sm bg-white/[0.07]">
              <div
                className="h-full rounded-sm bg-gradient-to-r from-accent to-success transition-[width] duration-700"
                style={{ width: `${cart.freeShipProgress}%` }}
              />
            </div>
          </div>
        )}
        {cart.count > 0 && cart.hasFreeShip && (
          <div className="flex shrink-0 items-center gap-2 border-b border-success/15 bg-success/[0.08] px-5 py-2.5">
            <span aria-hidden>🎉</span>
            <span className="font-body text-[13px] font-semibold text-success">
              {m.freeShipReached}
            </span>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {cart.count === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16">
              <span aria-hidden className="text-5xl opacity-30">
                🛒
              </span>
              <p className="text-center font-body text-[15px] text-ink-ghost">
                {m.empty}
                <br />
                {m.emptyHint}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {cart.items.map((item) => {
                // ⚠️ НАВІЩО (23.11.2026). Назва йшла одним рядком із truncate: на телефоні покупець
                // бачив «Футболка Abiko · Розмір …» — без розміру. Тому модель і варіант — окремі
                // рядки, варіант не обрізається. Фото й назва ведуть на картку: за місяць 53
                // «мертві» кліки по них у 18 із 55 сесій із кошиком (PostHog).
                const { name, variant } = splitCartModel(item.model);
                const path = cartItemPath(item);
                const href = path ? `/${locale}${path}` : null;
                const openItem = () => {
                  trackEvent({
                    name: "cart_item_click",
                    params: { product_slug: slugFromProductId(item.id) },
                  });
                  cart.close();
                };
                const thumbCls =
                  "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-white/[0.04] text-2xl";
                const thumb = item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-contain" />
                ) : (
                  item.emoji
                );
                // Рядка бренду тут більше немає: він завжди «Butterfly», а місце потрібне варіанту.
                const title = (
                  <>
                    <span className="block break-words text-sm font-extrabold leading-tight transition-colors group-hover:text-accent">
                      {name}
                    </span>
                    {variant && (
                      <span className="mt-1 block text-[13px] font-semibold leading-snug text-ink">
                        {variant}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3.5">
                    {href ? (
                      // Те саме посилання, що й назва: для клавіатури й скрінрідера лишаємо одне.
                      <Link
                        href={href}
                        prefetch={false}
                        onClick={openItem}
                        tabIndex={-1}
                        aria-hidden="true"
                        className={cn(
                          thumbCls,
                          "transition-colors hover:border-accent/40 active:opacity-70",
                        )}
                      >
                        {thumb}
                      </Link>
                    ) : (
                      <div aria-hidden className={thumbCls}>
                        {thumb}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {href ? (
                        // inline-block: посилання — лише сам текст, а не весь рядок до хрестика.
                        // Промах повз «+» чи «−» раніше був «мертвим» кліком, тепер закрив би
                        // кошик і повів на картку — тому зона посилання вузька, а кнопки більші.
                        <Link
                          href={href}
                          prefetch={false}
                          onClick={openItem}
                          className="group mb-3 inline-block max-w-full rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-70"
                        >
                          {title}
                        </Link>
                      ) : (
                        <div className="mb-3">{title}</div>
                      )}
                      <div className="flex items-center gap-1.5">
                        {/* Кнопки 40 px (було 28): зона дотику, по якій не промахуються повз посилання. */}
                        {/* ⚠️ НАВІЩО: на 1 штуці «−» раніше нічого не робив (кількість не нижче 1).
                          27.10.2026 покупець із кошиком на 18 815 ₴ натиснув його 15+ разів,
                          намагаючись прибрати основу, і пішов без замовлення. Тепер на 1 штуці
                          кнопка стає «видалити» — через remove, тож remove_from_cart теж іде. */}
                        {item.qty <= 1 ? (
                          <button
                            type="button"
                            onClick={() => cart.remove(item.id)}
                            aria-label={m.remove}
                            title={m.remove}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white/[0.05] text-ink-muted transition-colors hover:border-danger/40 hover:bg-danger/15 hover:text-danger"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => cart.changeQty(item.id, -1)}
                            aria-label={m.decrease}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white/[0.05] font-display text-base font-bold text-ink transition-colors hover:border-accent/40 hover:bg-accent/15 hover:text-accent"
                          >
                            −
                          </button>
                        )}
                        <span className="min-w-[24px] text-center font-display text-[15px] font-bold">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.changeQty(item.id, 1)}
                          aria-label={m.increase}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white/[0.05] font-display text-base font-bold text-ink transition-colors hover:border-accent/40 hover:bg-accent/15 hover:text-accent"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
                      <button
                        type="button"
                        onClick={() => cart.remove(item.id)}
                        aria-label={m.remove}
                        title={m.remove}
                        // Зона дотику 40 px; від'ємні поля тримають хрестик на тому самому місці.
                        className="-mr-2.5 -mt-2 flex h-10 w-10 items-center justify-center text-sm text-ink-ghost transition-colors hover:text-danger"
                      >
                        <CloseIcon />
                      </button>
                      <div className="font-display text-base font-black text-accent">
                        {formatPrice(item.price * item.qty)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.count > 0 && (
          <div className="shrink-0 border-t border-border-subtle px-5 pb-6 pt-4">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="font-body text-[13px] text-ink-muted">{m.total}:</span>
              <span className="font-display text-[22px] font-black">{formatPrice(cart.total)}</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mb-2.5"
              onClick={goCheckout}
              data-cta="begin-checkout"
              data-location="cart"
            >
              {m.checkout} →
            </Button>
            {oneClick && (
              <div className="mb-2.5">
                <QuickOrder
                  locale={locale}
                  productName={`${locale === "ru" ? "Корзина" : "Кошик"}: ${cart.count} шт. · ${formatPrice(cart.total)}`}
                  cart={{
                    items: cart.items.map((i) => ({
                      name: `${i.brand} ${i.model}`.slice(0, 160),
                      qty: i.qty,
                      price: i.price,
                      slug: slugFromProductId(i.id),
                    })),
                    total: cart.total,
                  }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={cart.close}
              className="w-full rounded-xl border border-border bg-white/[0.05] px-3 py-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-muted transition-colors hover:bg-white/[0.09] hover:text-ink"
            >
              ← {m.continueShopping}
            </button>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {[
                // Поки оплата лише при отриманні, «Безпечна оплата» із замком обіцяла онлайн-оплату,
                // якої немає. Кажемо, як є: це ще й знімає головне питання перед оформленням.
                COD_ONLY ? ["💵", messages.checkout.payment.cod.label] : ["🔒", m.trust.payment],
                ["🚚", m.trust.delivery],
                ["↩️", m.trust.returns],
              ].map(([icon, txt]) => (
                <span
                  key={txt}
                  className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-white/[0.04] px-2.5 py-1.5 font-body text-[11px] text-ink-dim"
                >
                  <span aria-hidden>{icon}</span>
                  {txt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutForm
          messages={messages}
          locale={locale}
          logoUrl={logoUrl}
          onClose={() => setCheckoutOpen(false)}
          onComplete={() => {
            cart.clear();
            setCheckoutOpen(false);
          }}
        />
      )}
    </>
  );
}
