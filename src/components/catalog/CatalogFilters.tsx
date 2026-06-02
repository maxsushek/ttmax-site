// src/components/catalog/CatalogFilters.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";

/** Сериализуемая модель карточки + поля для фильтрации (готовится на сервере). */
export type CatalogCardVM = {
  slug: string;
  href: string;
  brandName: string;
  model: string;
  secondary: string;
  /** Отформатированная цена ("від 4 155 ₴") или null. */
  priceLabel: string | null;
  /** Числовая цена для сортировки/фильтра (минимальная). */
  priceValue: number | null;
  inStock: boolean;
  /** Готовый URL картинки (Cloudinary) или null → плейсхолдер. */
  imageUrl: string | null;
  /** Значения для фасетов (любой ключ → значение). */
  facets: Record<string, string | undefined>;
  /** Исходный порядок (для сортировки «Популярні»). */
  order: number;
};

export type FacetOption = { value: string; label: string; count: number };
export type FacetGroup = { key: string; label: string; options: FacetOption[] };

type Props = {
  locale: "uk" | "ru";
  items: CatalogCardVM[];
  groups: FacetGroup[];
  /** Границы цены для подписи кнопок-бакетов. */
  priceBuckets: { label: string; min: number; max: number | null }[];
};

type SortKey = "popular" | "price-asc" | "price-desc" | "name";

const T = {
  uk: {
    filters: "Фільтри",
    sort: "Сортування",
    sortPopular: "Популярні",
    sortPriceAsc: "Спочатку дешевші",
    sortPriceDesc: "Спочатку дорожчі",
    sortName: "За назвою",
    inStock: "Тільки в наявності",
    price: "Ціна",
    reset: "Скинути",
    found: "Знайдено",
    nothing: "За вибраними фільтрами нічого не знайдено",
    showFilters: "Показати фільтри",
    hideFilters: "Сховати фільтри",
    priceOnRequest: "Ціна за запитом",
  },
  ru: {
    filters: "Фильтры",
    sort: "Сортировка",
    sortPopular: "Популярные",
    sortPriceAsc: "Сначала дешевле",
    sortPriceDesc: "Сначала дороже",
    sortName: "По названию",
    inStock: "Только в наличии",
    price: "Цена",
    reset: "Сбросить",
    found: "Найдено",
    nothing: "По выбранным фильтрам ничего не найдено",
    showFilters: "Показать фильтры",
    hideFilters: "Скрыть фильтры",
    priceOnRequest: "Цена по запросу",
  },
} as const;

function plural(n: number, locale: "uk" | "ru") {
  return locale === "ru" ? "товаров" : "товарів";
}

/** Будує вибір фасетів із query-параметрів URL (напр. ?bladeClass=off,off-plus). */
function selectedFromParams(
  params: ReadonlyURLSearchParams | null,
  knownKeys: Set<string>,
): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  if (!params) return out;
  params.forEach((value, key) => {
    if (!knownKeys.has(key)) return;
    const vals = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (vals.length) out[key] = new Set(vals);
  });
  return out;
}

export function CatalogFilters({ locale, items, groups, priceBuckets }: Props) {
  const t = T[locale];
  const searchParams = useSearchParams();
  const knownKeys = useMemo(() => new Set(groups.map((g) => g.key)), [groups]);

  // selected: { [groupKey]: Set<value> } — стартова з URL + реакція на навігацію (напр. підпункт меню).
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() =>
    selectedFromParams(searchParams, knownKeys),
  );
  useEffect(() => {
    setSelected(selectedFromParams(searchParams, knownKeys));
  }, [searchParams, knownKeys]);
  const [priceBucket, setPriceBucket] = useState<number | null>(null);
  const [onlyStock, setOnlyStock] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");
  const [openMobile, setOpenMobile] = useState(false);

  const activeCount =
    Object.values(selected).reduce((n, s) => n + s.size, 0) +
    (priceBucket !== null ? 1 : 0) +
    (onlyStock ? 1 : 0);

  const toggle = (groupKey: string, value: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupKey] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size === 0) delete next[groupKey];
      else next[groupKey] = set;
      return next;
    });
  };

  const reset = () => {
    setSelected({});
    setPriceBucket(null);
    setOnlyStock(false);
  };

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      // фасеты: внутри группы OR, между группами AND
      for (const [key, set] of Object.entries(selected)) {
        if (set.size === 0) continue;
        const v = item.facets[key];
        if (v === undefined || !set.has(v)) return false;
      }
      if (onlyStock && !item.inStock) return false;
      if (priceBucket !== null) {
        const b = priceBuckets[priceBucket];
        if (!b) return true;
        if (item.priceValue === null) return false;
        if (item.priceValue < b.min) return false;
        if (b.max !== null && item.priceValue > b.max) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity);
        case "price-desc":
          return (b.priceValue ?? -Infinity) - (a.priceValue ?? -Infinity);
        case "name":
          return a.model.localeCompare(b.model);
        default:
          return a.order - b.order;
      }
    });
    return list;
  }, [items, selected, onlyStock, priceBucket, priceBuckets, sort]);

  return (
    <div>
      {/* Панель управления */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-bg-raised px-3.5 py-2 font-display text-xs font-bold uppercase tracking-[0.08em] text-ink lg:hidden"
          aria-expanded={openMobile}
        >
          {t.filters}
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-bg-base">
              {activeCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="catalog-sort">
            {t.sort}
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-border-strong bg-bg-raised px-3 py-2 font-body text-sm text-ink outline-none transition-colors focus:border-accent/60"
          >
            <option value="popular">{t.sortPopular}</option>
            <option value="price-asc">{t.sortPriceAsc}</option>
            <option value="price-desc">{t.sortPriceDesc}</option>
            <option value="name">{t.sortName}</option>
          </select>
        </div>
      </div>

      {/* Фасеты: на мобиле скрываются за кнопкой, на десктопе всегда видны */}
      <div className={cn("mb-7 space-y-5", openMobile ? "block" : "hidden lg:block")}>
        {groups.map((g) => (
          <fieldset key={g.key}>
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              {g.label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const active = selected[g.key]?.has(o.value) ?? false;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(g.key, o.value)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "border-accent bg-accent/[0.08] text-ink"
                        : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                    )}
                  >
                    {o.label}
                    <span className={cn("text-[11px]", active ? "text-accent" : "text-ink-dim")}>
                      {o.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        {/* Цена */}
        {priceBuckets.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              {t.price}
            </legend>
            <div className="flex flex-wrap gap-2">
              {priceBuckets.map((b, i) => {
                const active = priceBucket === i;
                return (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setPriceBucket(active ? null : i)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm font-medium tabular-nums transition-all",
                      active
                        ? "border-accent bg-accent/[0.08] text-ink"
                        : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
                    )}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* В наличии + сброс */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setOnlyStock((v) => !v)}
            aria-pressed={onlyStock}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
              onlyStock
                ? "border-success/70 bg-success/[0.08] text-ink"
                : "border-border-strong text-ink-muted hover:border-border hover:text-ink",
            )}
          >
            <span
              aria-hidden
              className={cn("h-2 w-2 rounded-full", onlyStock ? "bg-success" : "bg-ink-ghost")}
            />
            {t.inStock}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="font-body text-sm text-ink-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              {t.reset}
            </button>
          )}
        </div>
      </div>

      {/* Счётчик */}
      <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-dim">
        {t.found}: {filtered.length} {plural(filtered.length, locale)}
      </p>

      {/* Сетка карточек */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-white/[0.015] p-10 text-center">
          <p className="font-body text-sm text-ink-muted">{t.nothing}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <li key={item.slug} className="h-full">
              <Link
                href={item.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised p-3 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-bg-elevated hover:shadow-card-hover sm:p-4"
                data-cta="catalog-product"
                data-location={item.slug}
              >
                <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={`${item.brandName} ${item.model}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-ghost">
                      {item.brandName}
                    </span>
                  )}
                  <div
                    className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-accent/60 transition-transform duration-[400ms] group-hover:scale-x-100"
                    aria-hidden
                  />
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-muted">
                  {item.brandName}
                </div>
                <div className="mt-0.5 font-display text-[16px] font-extrabold leading-tight tracking-tight text-ink">
                  {item.model}
                </div>
                {item.secondary && (
                  <div className="mt-1 font-body text-[11px] text-ink-dim">{item.secondary}</div>
                )}

                <div className="mt-auto pt-3 font-display text-sm font-black text-accent">
                  {item.priceLabel ?? t.priceOnRequest}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
