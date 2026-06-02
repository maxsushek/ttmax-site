// src/components/catalog/GearPurchasePanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY } from "@/lib/analytics/ecommerce";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { ProductCategory } from "@/types";

type Props = {
  locale: "uk" | "ru";
  slug: string;
  brandLabel: string;
  model: string;
  cartCategory: ProductCategory;
  accentColor: string;
  /** Розміри (одяг/взуття). Якщо порожньо — без вибору розміру. */
  sizes?: string[];
  priceFrom?: number;
  inStock?: boolean;
  phone: string;
  imageUrl?: string;
};

const LABELS = {
  uk: {
    size: "Розмір",
    addToCart: "В кошик",
    added: "Додано в кошик",
    request: "Запитати ціну",
    soldOut: "Немає в наявності",
    priceOnRequest: "Ціна за запитом",
    inStock: "В наявності",
    pickSize: "Оберіть розмір",
  },
  ru: {
    size: "Размер",
    addToCart: "В корзину",
    added: "Добавлено в корзину",
    request: "Узнать цену",
    soldOut: "Нет в наличии",
    priceOnRequest: "Цена по запросу",
    inStock: "В наличии",
    pickSize: "Выберите размер",
  },
} as const;

export function GearPurchasePanel({
  locale,
  slug,
  brandLabel,
  model,
  cartCategory,
  accentColor,
  sizes,
  priceFrom,
  inStock,
  phone,
  imageUrl,
}: Props) {
  const t = LABELS[locale];
  const cart = useCart();
  const hasSizes = Array.isArray(sizes) && sizes.length > 0;
  const [size, setSize] = useState<string>(hasSizes ? (sizes as string[])[0]! : "");

  // GA4 view_item
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
  const cartId = hasSizes ? `${slug}__${size}` : slug;
  const justAdded = cart.justAddedId === cartId;

  const addToCart = () => {
    if (!hasPrice || soldOut) return;
    cart.add({
      id: cartId,
      brand: brandLabel,
      model: hasSizes ? `${model} · ${t.size} ${size}` : model,
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

      {hasSizes && (
        <div className="mt-7">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            {t.size}
          </div>
          <div className="flex flex-wrap gap-2">
            {(sizes as string[]).map((s) => {
              const active = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={active}
                  className={cn(
                    "min-w-[44px] rounded-xl border px-3.5 py-2 text-center font-display text-sm font-bold transition-all",
                    active
                      ? "border-accent bg-accent/[0.08] text-ink"
                      : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
        {hasSizes && <p className="mt-2.5 text-center text-[11px] text-ink-dim">{t.pickSize}</p>}
      </div>
    </div>
  );
}
