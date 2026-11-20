// Блок «Розмірна сітка» на картці одягу та взуття — під вибором розміру.
//
// ⚠️ НАВІЩО. Хаби й FAQ обіцяли «таблицю розмірів на картці моделі», а її не було. Таблицю
// показуємо лише моделям, яким вона призначена явно (models[slug].charts у data/sizeCharts.ts):
// європейська й японська колекції Butterfly мають різні сітки. Решті — посилання на загальну
// сторінку: чужа сітка на картці гірша за її відсутність.
//
// <details> без JS: таблиця є в HTML (її читають пошуковики й ШІ), але не розтягує картку.
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import {
  SIZE_CHART_PATH,
  isPageChart,
  isSizedGearType,
  sizeChartsForProduct,
  sizeModelInfo,
} from "@/data/sizeCharts";
import { SizeChartTable } from "@/components/content/SizeChartTable";

const T = {
  ua: {
    title: "Розмірна сітка",
    hint: "як обрати розмір",
    all: "Усі таблиці розмірів Butterfly і як обрати розмір",
    linkOnly: "Розмірна сітка Butterfly: таблиці й як обрати розмір",
  },
  ru: {
    title: "Размерная сетка",
    hint: "как выбрать размер",
    all: "Все таблицы размеров Butterfly и как выбрать размер",
    linkOnly: "Размерная сетка Butterfly: таблицы и как выбрать размер",
  },
} satisfies Record<Locale, Record<string, string>>;

export function SizeHelp({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const gear = product.gear;
  if (!gear) return null;
  const t = T[locale];
  const charts = sizeChartsForProduct(product);
  const note = sizeModelInfo(product.slug)?.note ?? null;
  // Тип товару без розмірної сітки (напульсник, кепка) і без примітки — блоку немає.
  if (!isSizedGearType(gear.gearType) && !note) return null;

  const pageHref = `/${locale}${SIZE_CHART_PATH}`;
  // Якір — на першу таблицю моделі, яка є на сторінці (заміри окремих моделей живуть лише на картках).
  const anchor = charts.find((c) => isPageChart(c.id))?.id;

  // Таблиці саме для цієї моделі немає — лише посилання на сторінку.
  if (charts.length === 0 && !note) {
    return (
      <p className="mt-3 font-body text-[13px] text-ink-muted" data-size-help="link">
        <Link href={pageHref} prefetch={false} className="font-semibold text-accent hover:underline">
          {t.linkOnly} →
        </Link>
      </p>
    );
  }

  return (
    <details className="group mt-4 overflow-hidden rounded-2xl border border-border-strong" data-size-help="table">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="font-body text-[15px] font-medium text-white/90">
          {t.title} <span className="text-ink-muted">— {t.hint}</span>
        </span>
        <span className="shrink-0 text-xl leading-none text-accent transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-border-subtle px-4 pb-4 pt-3.5">
        {note && <p className="font-body text-[14px] leading-relaxed text-ink-muted">{note[locale]}</p>}
        {charts.map((chart) => (
          <div key={chart.id}>
            <p className="font-body text-[14px] font-bold text-ink">{chart.title[locale]}</p>
            <p className="mt-1 font-body text-[13px] leading-relaxed text-ink-muted">{chart.lead[locale]}</p>
            <div className="mt-2.5">
              <SizeChartTable chart={chart} locale={locale} dense />
            </div>
            {chart.note && (
              <p className="mt-2 font-body text-[12px] leading-relaxed text-ink-dim">{chart.note[locale]}</p>
            )}
          </div>
        ))}
        <p className="font-body text-[13px]">
          <Link
            href={anchor ? `${pageHref}#${anchor}` : pageHref}
            prefetch={false}
            className="font-semibold text-accent hover:underline"
          >
            {t.all} →
          </Link>
        </p>
      </div>
    </details>
  );
}
