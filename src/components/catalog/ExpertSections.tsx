// src/components/catalog/ExpertSections.tsx
// Розширена «топ-карточка»: вердикт → опис → оцінка → кому підійде → думка →
// порівняння → FAQ → готова ракетка. Серверний компонент, без клієнтського JS,
// mobile-first, високий контраст тексту на темному тлі (читабельність/WCAG).
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
  const h2 = "font-display text-lg font-bold uppercase tracking-[0.05em] text-ink sm:text-xl";
  const h3 = "mb-1.5 font-display text-[15px] font-bold uppercase tracking-[0.04em] text-ink sm:text-base";

  return (
    <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
      {/* 1 · Короткий вердикт */}
      <section className="rounded-3xl border border-accent/25 bg-accent/[0.05] p-5 sm:p-7">
        <div className="mb-2.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          {L("Короткий вердикт", "Краткий вердикт")}
        </div>
        <p className="font-body text-[15px] leading-[1.7] text-white/90 sm:text-lg sm:leading-[1.6]">
          {entry.verdict[locale]}
        </p>
        <p className="mt-3.5 border-t border-accent/15 pt-3.5 font-body text-[13px] leading-relaxed text-ink-muted">
          {entry.official[locale]}
        </p>
      </section>

      {/* 2 · Опис */}
      <section>
        <h2 className={h2}>{L("Опис", "Описание")}</h2>
        <div className="mt-5 max-w-[68ch] space-y-6">
          {entry.descriptionSections.map((s, i) => (
            <div key={i}>
              <h3 className={h3}>{s.title[locale]}</h3>
              <p className="font-body text-[15px] leading-[1.75] text-white/80">{s.body[locale]}</p>
            </div>
          ))}
          {entry.features.length > 0 && (
            <div>
              <h3 className={h3}>{L("Переваги", "Преимущества")}</h3>
              <ul className="space-y-2">
                {entry.features.map((f, i) => (
                  <li key={i} className="flex gap-3 font-body text-[15px] leading-[1.7] text-white/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{f[locale]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 3 · Оцінка магазину */}
      <section>
        <h2 className={h2}>{L("Оцінка магазину", "Оценка магазина")}</h2>
        <div className="mt-5 max-w-xl space-y-3.5">
          {entry.ratings.map((r) => {
            const pct = Math.max(6, Math.min(100, r.value * 10));
            return (
              <div key={r.label[locale]} className="flex items-center gap-3">
                <span className="w-[42%] shrink-0 font-body text-[13px] text-white/70 sm:w-[34%] sm:text-sm">
                  {r.label[locale]}
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.1]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,rgba(232,255,71,0.55),#E8FF47)]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right font-display text-sm font-bold tabular-nums text-accent">
                  {r.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 font-body text-[11px] leading-relaxed text-ink-muted">
          {L(
            "Шкала 0–10. На основі офіційних характеристик Butterfly.",
            "Шкала 0–10. На основе официальных характеристик Butterfly.",
          )}
        </p>
      </section>

      {/* 4 · Кому підійде / не підійде */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-strong bg-white/[0.025] p-5">
          <div className="mb-3 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.1em] text-accent">
            <Check />
            {L("Підійде, якщо", "Подойдёт, если")}
          </div>
          <ul className="space-y-2.5">
            {entry.audienceFor.map((a, i) => (
              <li key={i} className="font-body text-sm leading-[1.6] text-white/80">{a[locale]}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border-strong bg-white/[0.025] p-5">
          <div className="mb-3 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.1em] text-white/55">
            <Cross />
            {L("Не підійде, якщо", "Не подойдёт, если")}
          </div>
          <ul className="space-y-2.5">
            {entry.audienceNotFor.map((a, i) => (
              <li key={i} className="font-body text-sm leading-[1.6] text-white/70">{a[locale]}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 · Думка магазину */}
      <section className="rounded-2xl border-l-2 border-accent bg-white/[0.03] py-5 pl-5 pr-5">
        <div className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {L("Думка магазину", "Мнение магазина")}
        </div>
        <p className="font-body text-[15px] leading-[1.7] text-white/85">{entry.expert[locale]}</p>
      </section>

      {/* 6 · Порівняння лінійки */}
      {entry.comparison && entry.comparison.length > 0 && (
        <section>
          <h2 className={h2}>{L("Порівняння лінійки Dignics", "Сравнение линейки Dignics")}</h2>
          <div className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[460px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-strong font-display text-[11px] uppercase tracking-[0.06em] text-white/55">
                  <th className="py-2.5 pr-3 text-left font-bold">{L("Модель", "Модель")}</th>
                  <th className="px-2 py-2.5 text-center font-bold">{L("Швидк.", "Скор.")}</th>
                  <th className="px-2 py-2.5 text-center font-bold">{L("Оберт.", "Вращ.")}</th>
                  <th className="px-2 py-2.5 text-center font-bold">{L("Тверд.", "Жёст.")}</th>
                  <th className="py-2.5 pl-2 text-left font-bold">{L("Кому", "Кому")}</th>
                </tr>
              </thead>
              <tbody>
                {entry.comparison.map((row) => {
                  const cur = row.slug === currentSlug;
                  return (
                    <tr key={row.slug} className={`border-b border-border-subtle ${cur ? "bg-accent/[0.08]" : ""}`}>
                      <td className={`py-3 pr-3 font-semibold ${cur ? "text-accent" : "text-white/90"}`}>
                        {row.model}
                        {cur && (
                          <span className="ml-1.5 align-middle text-[9px] uppercase tracking-wide text-accent/70">
                            {L("ця", "эта")}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-white/75">{row.speed}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-white/75">{row.spin}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-white/75">{row.hardness}°</td>
                      <td className="py-3 pl-2 text-white/65">{row.fit[locale]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7 · FAQ */}
      {entry.faq.length > 0 && (
        <section>
          <h2 className={h2}>{L("Питання й відповіді", "Вопросы и ответы")}</h2>
          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-strong">
            {entry.faq.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-body text-[15px] font-medium text-white/90 [&::-webkit-details-marker]:hidden">
                  <span>{f.q[locale]}</span>
                  <span className="shrink-0 text-xl leading-none text-accent transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 font-body text-sm leading-[1.7] text-white/75">{f.a[locale]}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 8 · Готова ракетка */}
      {entry.comboHref && (
        <Link
          href={`/${locale}${entry.comboHref}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/[0.06] px-5 py-4 transition-colors hover:border-accent/55 hover:bg-accent/[0.1]"
        >
          <span className="font-display text-sm font-bold uppercase tracking-[0.05em] text-white/90">
            {L("Готова ракетка з цією накладкою", "Готовая ракетка с этой накладкой")}
          </span>
          <span className="shrink-0 font-display text-xl text-accent">→</span>
        </Link>
      )}
    </div>
  );
}
