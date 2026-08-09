"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { type Locale } from "@/i18n/config";
import { getPoll, type PollId } from "@/config/polls";

const UI: Record<
  Locale,
  { kicker: string; hint: string; total: string; thanks: string; change: string; error: string; loading: string }
> = {
  ua: {
    kicker: "Опитування",
    hint: "Один голос — результати одразу.",
    total: "Проголосувало",
    thanks: "Ваш голос зараховано",
    change: "Змінити відповідь",
    error: "Не вдалося зберегти голос. Спробуйте ще раз.",
    loading: "Завантажуємо…",
  },
  ru: {
    kicker: "Опрос",
    hint: "Один голос — результаты сразу.",
    total: "Проголосовало",
    thanks: "Ваш голос учтён",
    change: "Изменить ответ",
    error: "Не удалось сохранить голос. Попробуйте ещё раз.",
    loading: "Загружаем…",
  },
};

type Result = { counts: Record<string, number>; total: number; voted: string | null };

/**
 * Опитування «чим граєте ви» з живими результатами.
 *
 * ⚠️ Результати вантажимо на клієнті, а НЕ рендеримо на сервері. Сторінки статей
 * статичні (пререндер), тож серверний рендер зафіксував би цифри на момент збірки
 * і вони б не оновлювались до наступного деплою. Ціна — блок мигає скелетом; це
 * чесніше, ніж показувати замерлі числа.
 */
export function RubberPoll({ locale, poll }: { locale: Locale; poll: PollId }) {
  const ui = UI[locale];
  const def = getPoll(poll);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/poll?poll=${encodeURIComponent(poll)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Result | null) => {
        if (alive && d) setRes(d);
      })
      .catch(() => {
        // Мовчки: опитування — прикраса статті, воно не має ламати читання.
        if (alive) setRes({ counts: {}, total: 0, voted: null });
      });
    return () => {
      alive = false;
    };
  }, [poll]);

  const vote = useCallback(
    async (option: string) => {
      if (busy) return;
      setBusy(true);
      setFailed(false);
      try {
        const r = await fetch("/api/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poll, option }),
        });
        if (!r.ok) throw new Error(String(r.status));
        setRes((await r.json()) as Result);
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    },
    [busy, poll],
  );

  const voted = res?.voted ?? null;
  const total = res?.total ?? 0;
  // Поки нема жодного голосу — показуємо порожні смуги, а не ділимо на нуль.
  const pct = (key: string) => (total > 0 ? Math.round(((res?.counts[key] ?? 0) / total) * 100) : 0);

  return (
    <section className="mt-10 rounded-3xl border border-accent/25 bg-accent/[0.05] p-5 sm:p-7">
      <div className="mb-2.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        {ui.kicker}
      </div>
      <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-ink sm:text-xl">
        {def.question[locale]}
      </h2>
      <p className="mt-1.5 font-body text-[13px] text-ink-muted">
        {voted ? ui.thanks : ui.hint}
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {def.options.map((key) => {
          const label = def.labels[key]?.[locale] ?? key;
          const mine = voted === key;
          const share = pct(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => vote(key)}
              disabled={busy}
              aria-pressed={mine}
              className={`relative w-full overflow-hidden rounded-xl border-[1.5px] px-4 py-3 text-left transition-all disabled:opacity-60 ${
                mine
                  ? "border-accent bg-accent/[0.08]"
                  : "border-border-subtle bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              {/* Смуга результату — під текстом, тому текст лишається читабельним. */}
              {voted && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-accent/[0.14] transition-[width] duration-500"
                  style={{ width: `${share}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span
                  className={`font-body text-[15px] ${mine ? "font-bold text-accent" : "text-ink"}`}
                >
                  {label}
                </span>
                {voted && (
                  <span className="shrink-0 font-display text-[13px] font-bold tabular-nums text-ink-muted">
                    {share}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {failed && <p className="mt-3 font-body text-[13px] text-danger">{ui.error}</p>}

      {voted && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-accent/15 pt-3.5">
          <span className="font-body text-[13px] text-ink-muted">
            {ui.total}: <span className="font-bold text-ink">{total}</span>
          </span>
          {def.hrefs?.[voted] && (
            <Link
              href={`/${locale}${def.hrefs[voted]}`}
              className="font-body text-[13px] font-bold text-accent underline underline-offset-2"
            >
              {def.labels[voted]?.[locale] ?? voted} →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
