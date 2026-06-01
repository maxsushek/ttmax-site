// src/components/content/ContentSections.tsx
// Серверний рендер контентного блоку: body (markdown), таблиця порівняння, FAQ.
// Нічого не виводить, якщо полів немає (без авто-сміття). FAQ — на <details> (без JS, доступно, видимо).
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { ContentBlock } from "@/lib/content/get";
import { renderMarkdown } from "@/lib/content/markdown";

const PROSE =
  "font-body text-sm leading-relaxed text-ink-muted " +
  "[&_a]:text-accent [&_a:hover]:underline " +
  "[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[0.04em] [&_h2]:text-ink " +
  "[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink " +
  "[&_p]:mt-3 [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1";

/** Короткий вступний абзац (під H1). */
export function ContentIntro({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-4 max-w-3xl font-body text-sm leading-relaxed text-ink-muted">{text}</p>;
}

function ComparisonTable({ comparison }: { comparison: NonNullable<ContentBlock["comparison"]> }) {
  const { heading, columns, rows, note } = comparison;
  return (
    <section className="mt-10">
      {heading && (
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-[0.04em] text-ink">
          {heading}
        </h2>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border-strong">
        <table className="w-full border-collapse text-sm">
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className="border-b border-border-strong px-3 py-2.5 text-left font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white/[0.02]" : undefined}>
                {r.cells.map((cell, ci) => (
                  <td key={ci} className="border-b border-border-subtle px-3 py-2.5 text-ink">
                    {ci === 0 && r.href ? (
                      r.href.startsWith("/") ? (
                        <Link href={r.href} className="font-semibold text-accent hover:underline">
                          {cell}
                        </Link>
                      ) : (
                        <a
                          href={r.href}
                          rel="noopener noreferrer"
                          className="font-semibold text-accent hover:underline"
                        >
                          {cell}
                        </a>
                      )
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-2 font-body text-xs text-ink-ghost">{note}</p>}
    </section>
  );
}

function Faq({ items, locale }: { items: { q: string; a: string }[]; locale: Locale }) {
  const heading = locale === "ru" ? "Частые вопросы" : "Часті запитання";
  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-[0.04em] text-ink">
        {heading}
      </h2>
      <div className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-strong">
        {items.map((f, i) => (
          <details key={i} className="group px-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-display text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <span
                aria-hidden
                className="text-lg text-accent transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 font-body text-sm leading-relaxed text-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Body + порівняння + FAQ. Повертає null, якщо нічого з цього немає. */
export function ContentSections({ block, locale }: { block: ContentBlock | null; locale: Locale }) {
  if (!block) return null;
  const bodyHtml = block.body ? renderMarkdown(block.body) : "";
  const hasFaq = !!block.faq && block.faq.length > 0;
  if (!bodyHtml && !block.comparison && !hasFaq) return null;

  return (
    <div className="mt-12 border-t border-border-subtle pt-10">
      {bodyHtml && (
        <div className={`max-w-3xl ${PROSE}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}
      {block.comparison && <ComparisonTable comparison={block.comparison} />}
      {hasFaq && block.faq && <Faq items={block.faq} locale={locale} />}
    </div>
  );
}
