// src/components/catalog/GearPurchasePanel.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useGallerySync } from "./GallerySync";
import { useCart } from "@/components/cart/CartProvider";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY } from "@/lib/analytics/ecommerce";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { QuickOrder } from "@/components/catalog/QuickOrder";
import { DeliveryPaymentInfo } from "@/components/catalog/DeliveryPaymentInfo";
import type { ProductCategory } from "@/types";
import { cartModel } from "@/lib/cart/line";

type Props = {
  locale: "ua" | "ru";
  slug: string;
  /** Шлях картки без локалі — рядок кошика веде назад на товар. */
  href: string;
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
  /**
   * Розмірна сітка під кнопками (SizeHelp): "table" — таблиця є на цій картці, посилання біля
   * розмірів розкриває її й гортає до неї; "link" — таблиці немає, ведемо на сторінку сітки.
   */
  sizeHelp?: "table" | "link" | null;
  /** Адреса сторінки розмірної сітки з локаллю — для sizeHelp="link". */
  sizeChartHref?: string;
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
    pickSizeFirst: "Оберіть розмір, щоб додати в кошик",
    sizeChart: "Розмірна сітка",
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
    pickSizeFirst: "Выберите размер, чтобы добавить в корзину",
    sizeChart: "Размерная сетка",
    pickColor: "Выберите цвет",
  },
} as const;

export function GearPurchasePanel({
  locale,
  slug,
  href,
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
  sizeHelp = null,
  sizeChartHref,
}: Props) {
  const t = LABELS[locale];
  const cart = useCart();
  const hasOptions = Array.isArray(options) && options.length > 0;
  const optLabel = optionKind === "color" ? t.color : t.size;

  /**
   * Для кольорів індекс спільний із галереєю: вибрав «салатовий» — побачив
   * салатовий кадр, гортнув галерею — перемкнувся чип. Для розмірів синхронізувати
   * нічого (фото не залежить від розміру), тож там завжди локальний стан.
   *
   * ⚠️ КОНТРАКТ ДАНИХ: кольорові кадри йдуть ПЕРШИМИ й у тому самому порядку, що
   * gear.colorways. Перевірити просто — в entity_media.alt кожного кадру записано
   * назву кольору. Якщо додати кадр-деталізацію, ставити його ПІСЛЯ кольорових.
   */
  const sync = useGallerySync();
  const syncColors = optionKind === "color" && sync !== null && hasOptions;
  const optCount = hasOptions ? (options as string[]).length : 0;
  /**
   * ⚠️ РОЗМІР НЕ ОБИРАЄМО ЗА ПОКУПЦЯ (23.11.2026).
   * Було useState(0): перший розмір — XS — стояв вибраним, і «В кошик» клало його без жодного
   * кліку. PostHog за 22.10–23.11: M, L, S, XL обирали самі в 100% випадків, а XS у 8 рядках
   * із 9 потрапив у кошик саме так; XS є у 2 з 11 замовлень. Помітити помилку було ніде —
   * кошик на телефоні обрізав назву до «Футболка Abiko · Розмір …» (див. lib/cart/line.ts).
   *
   * Тепер розмір порожній, доки його не оберуть; кнопка каже «Оберіть розмір» і підсвічує
   * розміри, а не кладе товар. Не повертати значення за замовчуванням для розмірів.
   * Єдиний розмір (напр. лише «XXL») і кольори лишаються вибраними одразу: розмір без
   * альтернатив обирати нема з чого, а колір збігається з фото, яке покупець бачить.
   */
  const mustPick = optionKind === "size" && optCount > 1;
  const [localIdx, setLocalIdx] = useState<number | null>(mustPick ? null : 0);
  // Лічильник спроб купити без розміру: > 0 — показуємо підказку; зміна числа перезапускає поштовх.
  const [askPick, setAskPick] = useState(0);
  const optionsRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  // Колір — останній КОЛЬОРОВИЙ кадр галереї. Раніше індекс просто обрізався до останнього
  // кольору: щойно в галереї з'явиться кадр-деталізація після кольорових (а контракт вище
  // радить ставити його саме туди), перегляд цього кадру мовчки вибирав би останній колір —
  // та сама помилка, що й із розміром XS. Тепер на такому кадрі лишається колір, обраний до нього.
  const [colorIdx, setColorIdx] = useState(0);
  if (syncColors && sync.index < optCount && sync.index !== colorIdx) setColorIdx(sync.index);
  const idx: number | null = syncColors
    ? colorIdx
    : localIdx === null
      ? null
      : Math.min(localIdx, Math.max(optCount - 1, 0));
  /** Обране значення; null — варіантів немає або розмір ще не обрано. */
  const opt = hasOptions && idx !== null ? ((options as string[])[idx] ?? null) : null;
  const needsPick = hasOptions && opt === null;
  const showAsk = askPick > 0 && needsPick;
  const optLabelId = `${uid}-opt`;
  const askId = `${uid}-ask`;
  const pick = (i: number) => {
    if (syncColors) sync.setIndex(i);
    else setLocalIdx(i);
    setAskPick(0);
    const value = hasOptions ? (options as string[])[i] : undefined;
    if (value)
      trackEvent({
        name: "select_variant",
        params: {
          product_slug: slug,
          option: optionKind,
          value: String(value),
          variant_value: String(value),
        },
      });
  };

  // Натиснули «купити» без розміру: показати, що саме треба зробити, і підвести до розмірів.
  const requestPick = () => {
    setAskPick((n) => n + 1);
    trackEvent({ name: "variant_required", params: { product_slug: slug, option: optionKind } });
    const el = optionsRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // 72 — висота фіксованої шапки з запасом: розміри під нею теж «не видно».
    if (r.top < 72 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 320, easing: "ease-out" },
      );
    }
  };

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
  const cartId = opt !== null ? `${slug}__${opt}` : slug;
  const justAdded = !needsPick && cart.justAddedId === cartId;
  /** «Розмір M» / «Колір Чорний» — варіант у назві позиції; null, коли варіантів немає. */
  const variantLabel = opt !== null ? `${optLabel} ${opt}` : null;

  const addToCart = () => {
    if (!hasPrice || soldOut) return;
    if (needsPick) {
      requestPick();
      return;
    }
    cart.add({
      id: cartId,
      brand: brandLabel,
      model: cartModel(model, variantLabel),
      category: cartCategory,
      price: priceFrom as number,
      accentColor,
      emoji: "",
      image: imageUrl,
      href,
    });
  };

  // Посилання «Розмірна сітка» біля розмірів: таблиця лежить під кнопками (SizeHelp, <details>),
  // тож розкриваємо її й гортаємо до неї, а не ведемо покупця з картки.
  const openSizeHelp = (e: React.MouseEvent) => {
    const details = document.querySelector<HTMLDetailsElement>('details[data-size-help="table"]');
    if (!details) return; // блоку немає — спрацює звичайний перехід за href
    e.preventDefault();
    details.open = true;
    // Не scrollIntoView: верх блоку сховався б під фіксованою шапкою (64 px) — лишаємо запас.
    window.scrollTo({
      top: details.getBoundingClientRect().top + window.scrollY - 80,
      behavior: "smooth",
    });
    trackEvent({ name: "info_expand", params: { block: "size_chart" } });
  };
  // Розмір у швидкому замовленні — лише обраний покупцем: менеджеру не треба вгадувати.
  const quickOrderName = cartModel(
    `${brandLabel} ${model}`,
    optionKind === "size" ? variantLabel : null,
  );

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
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div
              id={optLabelId}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted"
            >
              {optLabel}
              {/* Обраний розмір — словами біля підпису: видно й без пошуку підсвіченої кнопки. */}
              {optionKind === "size" && opt !== null && <span className="text-ink">: {opt}</span>}
            </div>
            {optionKind === "size" && sizeHelp && sizeChartHref && (
              <Link
                href={sizeChartHref}
                prefetch={false}
                onClick={sizeHelp === "table" ? openSizeHelp : undefined}
                data-size-help-link={sizeHelp}
                // Від'ємні поля: зона дотику 44 px (переважно вгору, подалі від кнопок розмірів)
                // без зміни висоти рядка — промах по посиланню не має обирати розмір.
                className="-mb-2 -mt-5 shrink-0 pb-2 pt-5 text-[12px] font-semibold text-accent underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent"
              >
                {t.sizeChart}
              </Link>
            )}
          </div>
          <div
            ref={optionsRef}
            role="group"
            aria-labelledby={optLabelId}
            className="flex flex-wrap gap-2"
          >
            {(options as string[]).map((s, i) => {
              const active = i === idx;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => pick(i)}
                  aria-pressed={active}
                  className={cn(
                    // 44 px — мінімальна зона дотику: розмір тепер обирають обов'язково.
                    "min-h-[44px] min-w-[48px] rounded-xl border px-3.5 py-2 text-center font-display text-sm font-bold transition-all",
                    active
                      ? // Обране — суцільною заливкою: рамку в 1 px (як було) на телефоні не видно,
                        // саме так непомітно стояв вибраним XS.
                        "border-accent bg-accent text-bg-base"
                      : showAsk
                        ? // Підсвічуємо акцентом, не червоним: червона рамка на всіх розмірах
                          // читається як «немає в наявності».
                          "border-accent/70 text-ink hover:border-accent"
                        : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {/* Місце під підказку зарезервоване завжди (як рядок помилки в ui/Input): інакше вона
              з'являлась би між розмірами й кнопкою і зсувала кнопку з-під пальця. */}
          {mustPick && (
            <p
              id={askId}
              role="alert"
              className="mt-2 min-h-[20px] text-[13px] font-semibold leading-5 text-danger"
            >
              {showAsk ? t.pickSizeFirst : ""}
            </p>
          )}
        </div>
      )}

      <div className={cn("flex flex-col gap-2.5", mustPick ? "mt-3" : "mt-8")}>
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
              // Без розміру кнопка не купує, а просить його обрати — окрема мітка для аналітики.
              data-cta={needsPick ? "catalog-pick-size" : "catalog-add-to-cart"}
              data-location={slug}
              aria-describedby={showAsk ? askId : undefined}
              className={cn(
                // cta-sheen (globals.css): відблиск і підйом при наведенні, стиснення при натисканні.
                "cta-sheen w-full rounded-xl py-3.5 font-display text-sm font-bold uppercase tracking-[0.08em] transition-all",
                justAdded ? "bg-success text-white" : "bg-accent text-bg-base shadow-accent-glow",
              )}
            >
              {justAdded ? `✓ ${t.added}` : needsPick ? t.pickSize : t.addToCart}
            </button>
            <QuickOrder
              locale={locale}
              productSlug={slug}
              productName={quickOrderName}
              variant="secondary"
            />
          </>
        ) : (
          <>
            <QuickOrder
              locale={locale}
              productSlug={slug}
              productName={quickOrderName}
              variant="primary"
            />
            <a
              href={telHref}
              data-cta="catalog-request-price"
              data-location={slug}
              onClick={() =>
                trackEvent({
                  name: "phone_click",
                  params: {
                    location: "product",
                    product_slug: slug,
                    product: `${brandLabel} ${model}`,
                  },
                })
              }
              className="block w-full rounded-xl border border-border-strong py-3 text-center font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-muted transition-colors hover:border-border hover:text-ink"
            >
              {t.request}
            </a>
          </>
        )}
        {/* Для розмірів підказки тут немає: про розмір каже сама кнопка, доки його не обрано. */}
        {hasOptions && optionKind === "color" && (
          <p className="text-center text-[11px] text-ink-dim">{t.pickColor}</p>
        )}
        <DeliveryPaymentInfo locale={locale} />
      </div>
    </div>
  );
}
