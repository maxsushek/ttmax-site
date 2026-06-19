// src/components/catalog/ExpertSections.tsx
// Розширена «топ-карточка»: вердикт, рейтинг-бари, особливості, кому підійде/ні,
// думка магазину, порівняння лінійки, FAQ, лінк на готову ракетку.
// Серверний компонент, без клієнтського JS (FAQ — <details>), mobile-first.
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { ExpertEntry } from "@/data/catalog/expert";

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Cross() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ExpertSections({
  entry,
  locale,
  currentSlug,
}: {
  entry: ExpertEntry;
  locale: Locale;
  currentSlug: string;
}) {
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const H2 = "font-display text-base font-bold uppercase tracking-[0.06em] text-ink sm:text-lg";

  return (
    <div className="mt-10 space-y-9 sm:mt-12 sm:space-y-11">
      {/* Короткий вердикт */}
      <section className="rounded-3xl border border-accent/25 bg-accent/[0.04] p-5 sm:p-7">
        <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {L("Короткий вердикт", "Краткий вердикт")}
        </div>
        <p className="font-body text-[15px] leading-relaxed text-ink sm:text-base">{entry.verdict[locale]}</p>
        <p className="mt-3 border-t border-accent/15 pt-3 font-body text-xs leading-relaxed text-ink-muted">
          {entry.official[locale]}
        </p>
      </section>

      {/* Рейтинг магазину */}
      <section>
        <h2 className={H2}>{L("Оцінка магазину", "Оценка магазина")}</h2>
        <div className="mt-4 space-y-3">
          {entry.ratings.map((r) => {
            const pct = Math.max(6, Math.min(100, r.value * 10));
            return (
              <div key={r.label[locale]} className="flex items-center gap-3">
                <span className="w-[44%] shrink-0 font-body text-[13px] text-ink-muted sm:w-[32%] sm:text-sm">
                  {r.label[locale]}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,rgba(232,255,71,0.5),#E8FF47)]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-display text-sm font-bold tabular-nums text-accent">
                  {r.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 font-body text-[11px] leading-relaxed text-ink-ghost">
          {L(
            "Шкала 0–10. На основі офіційних характеристик Butterfly.",
            "Шкала 0–10. На основе официальных характеристик Butterfly.",
          )}
        </p>
      </section>

      {/* Особливості й технології */}
      <section>
        <h2 className={H2}>{L("Особливості й технології", "Особенности и технологии")}</h2>
        <ul className="mt-4 space-y-2.5">
          {entry.features.map((f, i) => (
            <li key={i} className="flex gap-3 font-body text-sm leading-relaxed text-ink-dim">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{f[locale]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Кому підійде / не підійде */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-strong bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
            <Check />
            {L("Підійде, якщо", "Подойдёт, если")}
          </div>
          <ul className="space-y-2">
            {entry.audienceFor.map((a, i) => (
              <li key={i} className="font-body text-[13px] leading-relaxed text-ink-dim sm:text-sm">
                {a[locale]}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border-strong bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            <Cross />
            {L("Не підійде, якщо", "Не подойдёт, если")}
          </div>
          <ul className="space-y-2">
            {entry.audienceNotFor.map((a, i) => (
              <li key={i} className="font-body text-[13px] leading-relaxed text-ink-dim sm:text-sm">
                {a[locale]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Думка магазину */}
      <section className="rounded-2xl border-l-2 border-accent bg-white/[0.02] py-4 pl-5 pr-5 sm:py-5">
        <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">
          {L("Думка магазину", "Мнение магазина")}
        </div>
        <p className="font-body text-sm leading-relaxed text-ink-dim sm:text-[15px]">{entry.expert[locale]}</p>
      </section>

      {/* Порівняння лінійки */}
      {entry.comparison && entry.comparison.length > 0 && (
        <section>
          <h2 className={H2}>{L("Порівняння лінійки Dignics", "Сравнение линейки Dignics")}</h2>
          <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[460px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-strong font-display text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                  <th className="py-2 pr-3 text-left font-bold">{L("Модель", "Модель")}</th>
                  <th className="px-2 py-2 text-center font-bold">{L("Швидк.", "Скор.")}</th>
                  <th className="px-2 py-2 text-center font-bold">{L("Оберт.", "Вращ.")}</th>
                  <th className="px-2 py-2 text-center font-bold">{L("Тверд.", "Жёст.")}</th>
                  <th className="py-2 pl-2 text-left font-bold">{L("Кому", "Кому")}</th>
                </tr>
              </thead>
              <tbody>
                {entry.comparison.map((row) => {
                  const cur = row.slug === currentSlug;
                  return (
                    <tr key={row.slug} className={`border-b border-border-subtle ${cur ? "bg-accent/[0.07]" : ""}`}>
                      <td className={`py-2.5 pr-3 font-semibold ${cur ? "text-accent" : "text-ink"}`}>
                        {row.model}
                        {cur && (
                          <span className="ml-1.5 align-middle text-[9px] uppercase tracking-wide text-accent/70">
                            {L("ця", "эта")}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-ink-dim">{row.speed}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-ink-dim">{row.spin}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-ink-dim">{row.hardness}°</td>
                      <td className="py-2.5 pl-2 text-ink-muted">{row.fit[locale]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FAQ */}
      {entry.faq.length > 0 && (
        <section>
          <h2 className={H2}>{L("Питання й відповіді", "Вопросы и ответы")}</h2>
          <div className="mt-4 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-strong">
            {entry.faq.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-body text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  <span>{f.q[locale]}</span>
                  <span className="shrink-0 text-lg leading-none text-accent transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 font-body text-[13px] leading-relaxed text-ink-muted sm:text-sm">
                  {f.a[locale]}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Готова ракетка з цією накладкою */}
      {entry.comboHref && (
        <Link
          href={`/${locale}${entry.comboHref}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/[0.05] px-5 py-4 transition-colors hover:border-accent/55 hover:bg-accent/[0.08]"
        >
          <span className="font-display text-[13px] font-bold uppercase tracking-[0.05em] text-ink sm:text-sm">
            {L("Готова ракетка з цією накладкою", "Готовая ракетка с этой накладкой")}
          </span>
          <span className="shrink-0 font-display text-lg text-accent">→</span>
        </Link>
      )}
    </div>
  );
}
