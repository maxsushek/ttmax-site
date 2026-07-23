// src/components/catalog/ProductPurchasePanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY } from "@/lib/analytics/ecommerce";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { QuickOrder } from "@/components/catalog/QuickOrder";
import type { Color } from "@/types/catalog";
import type { ProductCategory } from "@/types";

/** Сериализуемый срез варианта (server → client). */
export type PanelVariant = {
  thickness: string;
  color: Color;
  price?: number;
  inStock?: boolean;
};

type Props = {
  locale: "ua" | "ru";
  slug: string;
  brandLabel: string;
  model: string;
  cartCategory: ProductCategory;
  accentColor: string;
  colors: Color[];
  thicknessOptions: string[];
  variants: PanelVariant[];
  phone: string;
  imageUrl?: string;
};

const LABELS = {
  ua: {
    color: "Колір",
    thickness: "Товщина, мм",
    addToCart: "В кошик",
    added: "Додано в кошик",
    request: "Запитати ціну",
    soldOut: "Немає в наявності",
    priceOnRequest: "Ціна за запитом",
    inStock: "В наявності",
    pickNote: "Оберіть колір і товщину",
  },
  ru: {
    color: "Цвет",
    thickness: "Толщина, мм",
    addToCart: "В корзину",
    added: "Добавлено в корзину",
    request: "Узнать цену",
    soldOut: "Нет в наличии",
    priceOnRequest: "Цена по запросу",
    inStock: "В наличии",
    pickNote: "Выберите цвет и толщину",
  },
} as const;

const COLOR_LABELS: Record<"ua" | "ru", Record<Color, string>> = {
  ua: { black: "Чорна", red: "Червона" },
  ru: { black: "Чёрная", red: "Красная" },
};

const COLOR_SWATCH: Record<Color, string> = {
  black: "#0c0c0c",
  red: "#d61f26",
};

export function ProductPurchasePanel({
  locale,
  slug,
  brandLabel,
  model,
  cartCategory,
  accentColor,
  colors,
  thicknessOptions,
  variants,
  phone,
  imageUrl,
}: Props) {
  const t = LABELS[locale];
  const cart = useCart();

  const [color, setColor] = useState<Color>(colors[0] ?? "black");
  const [thickness, setThickness] = useState<string>(thicknessOptions[0] ?? "");

  // GA4 view_item при відкритті картки товару
  useEffect(() => {
    const repPrice =
      variants.find((v) => typeof v.price === "number" && (v.price as number) > 0)?.price ?? 0;
    trackEvent({
      name: "view_item",
      params: {
        currency: CURRENCY,
        value: repPrice as number,
        items: [
          { id: slug, name: model, brand: brandLabel, price: repPrice as number, quantity: 1 },
        ],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = variants.find((v) => v.thickness === thickness && v.color === color);
  const hasPrice = typeof selected?.price === "number" && selected.price > 0;
  const soldOut = selected?.inStock === false;

  const cartId = `${slug}__${thickness}__${color}`;
  const justAdded = cart.justAddedId === cartId;

  const addToCart = () => {
    if (!hasPrice || soldOut) return;
    cart.add({
      id: cartId,
      brand: brandLabel,
      model: `${model} · ${thickness} мм · ${COLOR_LABELS[locale][color]}`,
      category: cartCategory,
      price: selected!.price as number,
      accentColor,
      emoji: "",
      image: imageUrl,
    });
  };

  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <div>
      {/* Цена */}
      <div className="flex items-end gap-3">
        <span className="font-display text-[34px] font-black leading-none tracking-tight text-accent">
          {hasPrice ? formatPrice(selected!.price as number) : t.priceOnRequest}
        </span>
        {hasPrice && !soldOut && (
          <span className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
            {t.inStock}
          </span>
        )}
      </div>

      {/* Колір */}
      <div className="mt-7">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {t.color}
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const active = c === color;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                  active
                    ? "border-accent bg-accent/[0.08] text-ink"
                    : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                )}
              >
                <span
                  aria-hidden
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{ backgroundColor: COLOR_SWATCH[c] }}
                />
                {COLOR_LABELS[locale][c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Товщина */}
      <div className="mt-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {t.thickness}
        </div>
        <div className="flex flex-wrap gap-2">
          {thicknessOptions.map((th) => {
            const active = th === thickness;
            return (
              <button
                key={th}
                type="button"
                onClick={() => setThickness(th)}
                aria-pressed={active}
                className={cn(
                  "min-w-[52px] rounded-xl border px-3.5 py-2 text-sm font-semibold tabular-nums transition-all",
                  active
                    ? "border-accent bg-accent/[0.08] text-ink"
                    : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                )}
              >
                {th}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
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
        <p className="text-center text-[11px] text-ink-dim">{t.pickNote}</p>
      </div>
    </div>
  );
}
