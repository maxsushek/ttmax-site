// src/components/catalog/BasePurchasePanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY } from "@/lib/analytics/ecommerce";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Handle } from "@/types/catalog";
import type { ProductCategory } from "@/types";

type Props = {
  locale: "ua" | "ru";
  slug: string;
  brandLabel: string;
  model: string;
  cartCategory: ProductCategory;
  accentColor: string;
  handles: Handle[];
  priceFrom?: number;
  inStock?: boolean;
  phone: string;
  imageUrl?: string;
};

const LABELS = {
  ua: {
    handle: "Тип ручки",
    addToCart: "В кошик",
    added: "Додано в кошик",
    request: "Запитати ціну",
    soldOut: "Немає в наявності",
    priceOnRequest: "Ціна за запитом",
    inStock: "В наявності",
    pickNote: "Оберіть тип ручки",
  },
  ru: {
    handle: "Тип ручки",
    addToCart: "В корзину",
    added: "Добавлено в корзину",
    request: "Узнать цену",
    soldOut: "Нет в наличии",
    priceOnRequest: "Цена по запросу",
    inStock: "В наличии",
    pickNote: "Выберите тип ручки",
  },
} as const;

const HANDLE_LABELS: Record<"ua" | "ru", Record<Handle, { code: string; note: string }>> = {
  ua: {
    fl: { code: "FL", note: "конічна" },
    st: { code: "ST", note: "пряма" },
    an: { code: "AN", note: "анатомічна" },
    cs: { code: "CS", note: "кит. перо" },
  },
  ru: {
    fl: { code: "FL", note: "коническая" },
    st: { code: "ST", note: "прямая" },
    an: { code: "AN", note: "анатомическая" },
    cs: { code: "CS", note: "кит. перо" },
  },
};

export function BasePurchasePanel({
  locale,
  slug,
  brandLabel,
  model,
  cartCategory,
  accentColor,
  handles,
  priceFrom,
  inStock,
  phone,
  imageUrl,
}: Props) {
  const t = LABELS[locale];
  const cart = useCart();

  const [handle, setHandle] = useState<Handle>(handles[0] ?? "fl");

  // GA4 view_item при відкритті картки основи
  useEffect(() => {
    const repPrice = priceFrom ?? 0;
    trackEvent({
      name: "view_item",
      params: {
        currency: CURRENCY,
        value: repPrice,
        items: [{ id: slug, name: model, brand: brandLabel, price: repPrice, quantity: 1 }],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPrice = typeof priceFrom === "number" && priceFrom > 0;
  const soldOut = inStock === false;
  const cartId = `${slug}__${handle}`;
  const justAdded = cart.justAddedId === cartId;

  const addToCart = () => {
    if (!hasPrice || soldOut) return;
    cart.add({
      id: cartId,
      brand: brandLabel,
      model: `${model} · ${HANDLE_LABELS[locale][handle].code}`,
      category: cartCategory,
      price: priceFrom as number,
      accentColor,
      emoji: "",
      image: imageUrl,
    });
  };

  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="font-display text-[34px] font-black leading-none tracking-tight text-accent">
          {hasPrice ? formatPrice(priceFrom as number) : t.priceOnRequest}
        </span>
        {hasPrice && !soldOut && (
          <span className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
            {t.inStock}
          </span>
        )}
      </div>

      {/* Тип ручки */}
      <div className="mt-7">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {t.handle}
        </div>
        <div className="flex flex-wrap gap-2">
          {handles.map((h) => {
            const active = h === handle;
            const lab = HANDLE_LABELS[locale][h];
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHandle(h)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start rounded-xl border px-3.5 py-2 transition-all",
                  active
                    ? "border-accent bg-accent/[0.08] text-ink"
                    : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                )}
              >
                <span className="font-display text-sm font-bold">{lab.code}</span>
                <span className="text-[10px] text-ink-dim">{lab.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8">
        {soldOut ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-border-strong bg-white/[0.02] py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-dim"
          >
            {t.soldOut}
          </button>
        ) : hasPrice ? (
          <button
            type="button"
            onClick={addToCart}
            data-cta="catalog-add-to-cart"
            data-location={slug}
            className={cn(
              "w-full rounded-xl py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] transition-all active:scale-[0.99]",
              justAdded
                ? "bg-success text-white"
                : "bg-accent text-bg-base shadow-accent-glow hover:brightness-110",
            )}
          >
            {justAdded ? `✓ ${t.added}` : t.addToCart}
          </button>
        ) : (
          <a
            href={telHref}
            data-cta="catalog-request-price"
            data-location={slug}
            className="block w-full rounded-xl bg-accent py-3.5 text-center font-display text-sm font-bold uppercase tracking-[0.08em] text-bg-base shadow-accent-glow transition-all hover:brightness-110"
          >
            {t.request}
          </a>
        )}
        <p className="mt-2.5 text-center text-[11px] text-ink-dim">{t.pickNote}</p>
      </div>
    </div>
  );
}
