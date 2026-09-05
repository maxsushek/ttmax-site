// src/components/catalog/GearPurchasePanel.tsx
"use client";

import { useEffect, useState } from "react";
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
  /**
   * Значення єдиного селектора: розміри (одяг/взуття) АБО кольори (інвентар,
   * що йде в кількох розфарбуваннях). Порожньо — селектора немає.
   */
  options?: string[];
  /**
   * Що саме обирають. Впливає лише на підпис і на текст позиції в замовленні —
   * механіка одна: обране значення входить у cartId і в назву позиції, тож
   * менеджер бачить у заявці конкретний варіант, а не просто модель.
   */
  optionKind?: "size" | "color";
  priceFrom?: number;
  inStock?: boolean;
  phone: string;
  imageUrl?: string;
};

const LABELS = {
  ua: {
    size: "Розмір",
    color: "Колір",
    addToCart: "В кошик",
    added: "Додано в кошик",
    request: "Запитати ціну",
    soldOut: "Немає в наявності",
    priceOnRequest: "Ціна за запитом",
    inStock: "В наявності",
    pickSize: "Оберіть розмір",
    pickColor: "Оберіть колір",
  },
  ru: {
    size: "Размер",
    color: "Цвет",
    addToCart: "В корзину",
    added: "Добавлено в корзину",
    request: "Узнать цену",
    soldOut: "Нет в наличии",
    priceOnRequest: "Цена по запросу",
    inStock: "В наличии",
    pickSize: "Выберите размер",
    pickColor: "Выберите цвет",
  },
} as const;

export function GearPurchasePanel({
  locale,
  slug,
  brandLabel,
  model,
  cartCategory,
  accentColor,
  options,
  optionKind = "size",
  priceFrom,
  inStock,
  phone,
  imageUrl,
}: Props) {
  const t = LABELS[locale];
  const cart = useCart();
  const hasOptions = Array.isArray(options) && options.length > 0;
  const optLabel = optionKind === "color" ? t.color : t.size;
  const [opt, setOpt] = useState<string>(hasOptions ? (options as string[])[0]! : "");

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
  const cartId = hasOptions ? `${slug}__${opt}` : slug;
  const justAdded = cart.justAddedId === cartId;

  const addToCart = () => {
    if (!hasPrice || soldOut) return;
    cart.add({
      id: cartId,
      brand: brandLabel,
      model: hasOptions ? `${model} · ${optLabel} ${opt}` : model,
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

      {hasOptions && (
        <div className="mt-7">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            {optLabel}
          </div>
          <div className="flex flex-wrap gap-2">
            {(options as string[]).map((s) => {
              const active = s === opt;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOpt(s)}
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

      <div className="mt-8 flex flex-col gap-2.5">
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
        {hasOptions && (
          <p className="text-center text-[11px] text-ink-dim">
            {optionKind === "color" ? t.pickColor : t.pickSize}
          </p>
        )}
      </div>
    </div>
  );
}
