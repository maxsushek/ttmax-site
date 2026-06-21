// src/components/catalog/RichContent.tsx
// Рендер багатого SEO-контенту (categoryContent.ts): вступ → картки типів →
// розділи → таблиця порівняння → FAQ → перелінковка. Серверний, без JS,
// читабельний (text-white/80+), мобайл-first (таблиця скролиться в межах контенту).
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { RichContent as RC } from "@/data/catalog/categoryContent";

export function RichContent({ content, locale }: { content: RC; locale: Locale }) {
  const L = (x: Record<Locale, string>) => (locale === "ru" ? x.ru : x.ua);
  const T = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const h2 = "font-display text-lg font-bold uppercase tracking-[0.05em] text-ink sm:text-xl";
  const h3 = "mb-1.5 font-display text-[15px] font-bold uppercase tracking-[0.04em] text-ink sm:text-base";

  return (
    <div className="mt-14 space-y-12 border-t border-border-subtle pt-10 sm:mt-16">
      {/* Вступ */}
      {content.lead.length > 0 && (
        <div className="max-w-[70ch] space-y-4">
          {content.lead.map((p, i) => (
            <p key={i} className="font-body text-[15px] leading-[1.75] text-white/80">
              {L(p)}
            </p>
          ))}
        </div>
      )}

      {/* Картки типів */}
      {content.cards && content.cards.length > 0 && (
        <section>
          {content.cardsHeading && <h2 className={`${h2} mb-5`}>{L(content.cardsHeading)}</h2>}
          <div className="grid gap-4 sm:grid-cols-2">
            {content.cards.map((c, i) => (
              <div key={i} className="rounded-2xl border border-border-strong bg-white/[0.025] p-5">
                <h3 className={h3}>{L(c.title)}</h3>
                <p className="font-body text-sm leading-[1.7] text-white/80">{L(c.body)}</p>
                {c.href && c.linkLabel && (
                  <Link
                    href={`/${locale}${c.href}`}
                    className="mt-3 inline-block font-display text-xs font-bold uppercase tracking-[0.04em] text-accent hover:underline"
                  >
                    {L(c.linkLabel)}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Розділи */}
      {content.sections && content.sections.length > 0 && (
        <section className="max-w-[70ch] space-y-6">
          {content.sections.map((s, i) => (
            <div key={i}>
              <h3 className={h3}>{L(s.title)}</h3>
              <p className="font-body text-[15px] leading-[1.75] text-white/80">{L(s.body)}</p>
            </div>
          ))}
        </section>
      )}

      {/* Таблиця порівняння */}
      {content.comparison && (
        <section>
          <h2 className={h2}>{L(content.comparison.heading)}</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-strong font-display text-[11px] uppercase tracking-[0.06em] text-white/55">
                  {content.comparison.columns.map((c, i) => (
                    <th key={i} className={`py-2.5 text-left font-bold ${i === 0 ? "pr-3" : "px-2"}`}>
                      {L(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.comparison.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    {r.cells.map((cell, j) => (
                      <td
                        key={j}
                        className={`py-3 ${j === 0 ? "pr-3 font-semibold text-white/90" : "px-2 text-white/70"}`}
                      >
                        {j === 0 && r.href ? (
                          <Link href={`/${locale}${r.href}`} className="text-accent hover:underline">
                            {L(cell)}
                          </Link>
                        ) : (
                          L(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {content.comparison.note && (
            <p className="mt-3 font-body text-[11px] leading-relaxed text-ink-muted">
              {L(content.comparison.note)}
            </p>
          )}
        </section>
      )}

      {/* FAQ */}
      {content.faq.length > 0 && (
        <section>
          <h2 className={h2}>{T("Питання й відповіді", "Вопросы и ответы")}</h2>
          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-strong">
            {content.faq.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-body text-[15px] font-medium text-white/90 [&::-webkit-details-marker]:hidden">
                  <span>{L(f.q)}</span>
                  <span className="shrink-0 text-xl leading-none text-accent transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 font-body text-sm leading-[1.7] text-white/75">{L(f.a)}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Перелінковка */}
      {content.links.length > 0 && (
        <section>
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
            {T("Дивіться також", "Смотрите также")}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {content.links.map((l) => (
              <Link
                key={l.href}
                href={`/${locale}${l.href}`}
                className="rounded-full border border-border-strong bg-white/[0.02] px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.04em] text-white/85 transition-colors hover:border-accent/40 hover:text-accent"
              >
                {L(l.label)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
