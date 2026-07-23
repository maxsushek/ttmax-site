// src/components/catalog/RacketComboPanel.tsx
"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY } from "@/lib/analytics/ecommerce";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { QuickOrder } from "@/components/catalog/QuickOrder";
import type { ProductCategory } from "@/types";

type Props = {
  locale: "ua" | "ru";
  slug: string;
  brandLabel: string;
  model: string;
  cartCategory: ProductCategory;
  accentColor: string;
  oldPrice?: number;
  promoPrice?: number;
  discountPct: number;
  inStock?: boolean;
  phone: string;
  imageUrl?: string;
};

const LABELS = {
  ua: {
    addToCart: "В кошик",
    added: "Додано в кошик",
    request: "Запитати ціну",
    soldOut: "Немає в наявності",
    inStock: "В наявності",
    save: "Економія",
  },
  ru: {
    addToCart: "В корзину",
    added: "Добавлено в корзину",
    request: "Узнать цену",
    soldOut: "Нет в наличии",
    inStock: "В наличии",
    save: "Экономия",
  },
} as const;

export function RacketComboPanel({
  locale,
  slug,
  brandLabel,
  model,
  cartCategory,
  accentColor,
  oldPrice,
  promoPrice,
  discountPct,
  inStock,
  phone,
  imageUrl,
}: Props) {
  const t = LABELS[locale];
  const cart = useCart();
  const hasPrice = typeof promoPrice === "number" && promoPrice > 0;
  const soldOut = inStock === false;
  const justAdded = cart.justAddedId === slug;
  const showOld =
    typeof oldPrice === "number" && hasPrice && oldPrice > (promoPrice as number);
  const save = showOld ? (oldPrice as number) - (promoPrice as number) : 0;

  useEffect(() => {
    trackEvent({
      name: "view_item",
      params: {
        currency: CURRENCY,
        value: promoPrice ?? 0,
        items: [{ id: slug, name: model, brand: brandLabel, price: promoPrice ?? 0, quantity: 1 }],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = () => {
    if (!hasPrice || soldOut) return;
    cart.add({
      id: slug,
      brand: brandLabel,
      model,
      category: cartCategory,
      price: promoPrice as number,
      accentColor,
      emoji: "",
      image: imageUrl,
    });
  };

  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="font-display text-[34px] font-black leading-none tracking-tight text-accent">
          {hasPrice ? formatPrice(promoPrice as number) : t.request}
        </span>
        {showOld && (
          <span className="mb-1 font-body text-lg text-ink-dim line-through">
            {formatPrice(oldPrice as number)}
          </span>
        )}
        {hasPrice && discountPct > 0 && (
          <span className="mb-1.5 rounded-md bg-accent px-2 py-0.5 font-display text-xs font-black text-bg-base">
            −{discountPct}%
          </span>
        )}
      </div>

      {save > 0 && (
        <div className="mt-1.5 text-xs font-semibold text-success">
          {t.save}: {formatPrice(save)}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-2.5">
        {soldOut ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-border-strong bg-white/[0.02] py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-dim"
          >
            {t.soldOut}
          </button>
        ) : hasPrice ? (
          <>
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
            <QuickOrder
              locale={locale}
              productSlug={slug}
              productName={`${brandLabel} ${model}`}
              variant="secondary"
            />
          </>
        ) : (
          <>
            <QuickOrder
              locale={locale}
              productSlug={slug}
              productName={`${brandLabel} ${model}`}
              variant="primary"
            />
            <a
              href={telHref}
              data-cta="catalog-request-price"
              data-location={slug}
              className="block w-full rounded-xl border border-border-strong py-3 text-center font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-muted transition-colors hover:border-border hover:text-ink"
            >
              {t.request}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
