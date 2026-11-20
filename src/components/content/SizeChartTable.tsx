// Таблиця розмірної сітки: одна розмітка для сторінки /rozmirna-sitka і блоку на картці товару.
//
// ⚠️ НЕ .rtable (картка на кожен рядок, як у порівняльних таблиць блогу). Розмірну таблицю читають
// інакше: порівнюють СУСІДНІ розміри (M чи L?), а в картках їх поруч не видно, і 11 розмірів × 8
// таблиць розтягували сторінку на телефоні на десятки екранів. Тому таблиця лишається таблицею:
// широка гортається вбік, колонка з розміром закріплена.
import type { Locale } from "@/i18n/config";
import type { SizeChart } from "@/data/sizeCharts";

const HINT: Record<Locale, string> = {
  ua: "Гортайте таблицю вбік →",
  ru: "Листайте таблицу вбок →",
};

export function SizeChartTable({
  chart,
  locale,
  dense = false,
}: {
  chart: SizeChart;
  locale: Locale;
  /** Щільніший варіант — для блоку на картці товару. */
  dense?: boolean;
}) {
  // До 4 коротких колонок (розміри взуття, мірки тіла) уміщуються в екран телефона без прокрутки.
  const compact = chart.columns.length <= 4;
  // 8+ колонок (куртка костюма — 10) мусять уміститися в колонку сторінки на десктопі.
  const wide = chart.columns.length >= 8;
  const pad = dense || wide ? "px-2 py-1.5" : "px-3 py-2";
  const text = dense ? "text-[13px]" : "text-[14px]";
  const head = dense || wide ? "text-[12px]" : "text-[13px]";
  return (
    <div>
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse font-body ${text} ${compact ? "" : "max-sm:w-max max-sm:min-w-full"}`}>
          <caption className="sr-only">{chart.title[locale]}</caption>
          <thead>
            <tr>
              {chart.columns.map((c, ci) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`border-b border-border-strong ${pad} ${head} text-left align-bottom font-bold text-ink-muted ${
                    ci === 0 ? "sticky left-0 z-[1] bg-bg-base" : ""
                  }`}
                >
                  {/* На телефоні широка таблиця має ширину вмісту: фіксуємо ширину підпису, щоб довгі
                      назви мірок переносилися, а не розтягували колонку. */}
                  {ci === 0 || compact ? c.label[locale] : <span className="block max-sm:w-[5.25rem]">{c.label[locale]}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, ri) => (
              <tr key={ri}>
                {chart.columns.map((c, ci) =>
                  ci === 0 ? (
                    <th
                      key={c.key}
                      scope="row"
                      className={`sticky left-0 z-[1] whitespace-nowrap border-b border-border-subtle bg-bg-base ${pad} text-left font-bold text-ink`}
                    >
                      {row[c.key]}
                    </th>
                  ) : (
                    <td key={c.key} className={`border-b border-border-subtle ${pad} text-ink`}>
                      {row[c.key]}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && <p className="mt-1.5 font-body text-[12px] text-ink-dim sm:hidden">{HINT[locale]}</p>}
    </div>
  );
}
