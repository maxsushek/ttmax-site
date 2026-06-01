"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/utils/format";
import { t } from "@/i18n";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY, toAnalyticsItems } from "@/lib/analytics/ecommerce";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";

type Props = {
  messages: Messages;
  locale: Locale;
  logoUrl?: string;
};

export function CartDrawer({ messages, locale, logoUrl }: Props) {
  const cart = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const m = messages.cart;

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
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={m.title}
        className={cn(
          "fixed bottom-0 right-0 top-0 z-[810] flex w-full max-w-[420px] flex-col",
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
            ✕
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
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3.5">
                  <div
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-white/[0.04] text-2xl"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      item.emoji
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-ghost">
                      {item.brand}
                    </div>
                    <div className="mb-1.5 truncate text-sm font-extrabold leading-tight">
                      {item.model}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cart.changeQty(item.id, -1)}
                        aria-label="−"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white/[0.05] font-display text-base font-bold text-ink transition-colors hover:border-accent/40 hover:bg-accent/15 hover:text-accent"
                      >
                        −
                      </button>
                      <span className="min-w-[20px] text-center font-display text-[15px] font-bold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.changeQty(item.id, 1)}
                        aria-label="+"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white/[0.05] font-display text-base font-bold text-ink transition-colors hover:border-accent/40 hover:bg-accent/15 hover:text-accent"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => cart.remove(item.id)}
                      aria-label={messages.common.close}
                      className="p-1 text-sm text-ink-ghost transition-colors hover:text-danger"
                    >
                      ✕
                    </button>
                    <div className="font-display text-base font-black text-accent">
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                </li>
              ))}
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
            <button
              type="button"
              onClick={cart.close}
              className="w-full rounded-xl border border-border bg-white/[0.05] px-3 py-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-muted transition-colors hover:bg-white/[0.09] hover:text-ink"
            >
              ← {m.continueShopping}
            </button>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {[
                ["🔒", m.trust.payment],
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
      </aside>

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
