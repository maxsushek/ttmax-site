"use client";

import { useState } from "react";
import Link from "next/link";
import { type Locale } from "@/i18n/config";

type LevelKey = "beginner" | "amateur" | "pro";
type L = Record<Locale, string>;

const UI: Record<Locale, { kicker: string; heading: string; hint: string; pick: string; base: string; rubbers: string; reset: string }> = {
  ua: {
    kicker: "Інтерактив",
    heading: "Підбери ракетку за 10 секунд",
    hint: "Обери свій рівень — підкажемо основу й накладки.",
    pick: "Рекомендація",
    base: "Основа",
    rubbers: "Накладки",
    reset: "Обрати ще раз",
  },
  ru: {
    kicker: "Интерактив",
    heading: "Подбери ракетку за 10 секунд",
    hint: "Выбери свой уровень — подскажем основание и накладки.",
    pick: "Рекомендация",
    base: "Основание",
    rubbers: "Накладки",
    reset: "Выбрать ещё раз",
  },
};

type LevelDef = {
  key: LevelKey;
  label: L;
  tagline: L;
  verdict: L;
  base: { label: L; href: string };
  rubbers: { label: L; href: string };
};

const LEVELS: LevelDef[] = [
  {
    key: "beginner",
    label: { ua: "Новачок", ru: "Новичок" },
    tagline: { ua: "Тільки починаю, вчу удари", ru: "Только начинаю, учу удары" },
    verdict: {
      ua: "Головне — контроль і відчуття м'яча. Бери all-round основу середньої швидкості й м'які гладкі накладки.",
      ru: "Главное — контроль и ощущение мяча. Бери all-round основание средней скорости и мягкие гладкие накладки.",
    },
    base: { label: { ua: "Petr Korbel (контроль)", ru: "Petr Korbel (контроль)" }, href: "/butterfly/osnovaniya/petr-korbel" },
    rubbers: { label: { ua: "Rozena / Tenergy 05 FX", ru: "Rozena / Tenergy 05 FX" }, href: "/nakladki" },
  },
  {
    key: "amateur",
    label: { ua: "Аматор", ru: "Любитель" },
    tagline: { ua: "Граю регулярно, хочу прогресу", ru: "Играю регулярно, хочу прогресса" },
    verdict: {
      ua: "Тобі підійде ALC-основа середньої швидкості й топова гладка накладка — швидкість із запасом контролю.",
      ru: "Тебе подойдёт ALC-основание средней скорости и топовая гладкая накладка — скорость с запасом контроля.",
    },
    base: { label: { ua: "Viscaria / Timo Boll ALC", ru: "Viscaria / Timo Boll ALC" }, href: "/osnovaniya/alc" },
    rubbers: { label: { ua: "Tenergy 05", ru: "Tenergy 05" }, href: "/butterfly/nakladki/tenergy-05" },
  },
  {
    key: "pro",
    label: { ua: "Про / атака", ru: "Про / атака" },
    tagline: { ua: "Поставлена техніка, перший темп", ru: "Поставленная техника, первый темп" },
    verdict: {
      ua: "Швидка карбонова основа й топові спінові накладки під поставлений удар і атаку першим темпом.",
      ru: "Быстрое карбоновое основание и топовые спиновые накладки под поставленный удар и атаку первым темпом.",
    },
    base: { label: { ua: "Viscaria", ru: "Viscaria" }, href: "/butterfly/osnovaniya/viscaria" },
    rubbers: { label: { ua: "Dignics 09C / Dignics 05", ru: "Dignics 09C / Dignics 05" }, href: "/butterfly/nakladki/dignics-09c" },
  },
];

export function RacketPickerQuiz({ locale }: { locale: Locale }) {
  const ui = UI[locale];
  const [picked, setPicked] = useState<LevelKey | null>(null);
  const chosen = LEVELS.find((l) => l.key === picked) ?? null;

  return (
    <section className="my-10 rounded-2xl border border-border-subtle bg-bg-raised p-5 sm:p-6">
      <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{ui.kicker}</p>
      <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-ink">{ui.heading}</h2>
      <p className="mb-4 font-body text-[13px] text-ink-muted">{ui.hint}</p>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {LEVELS.map((l) => {
          const active = l.key === picked;
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => setPicked(active ? null : l.key)}
              aria-pressed={active}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <span className={`block font-display text-[15px] font-bold uppercase ${active ? "text-accent" : "text-ink"}`}>
                {l.label[locale]}
              </span>
              <span className="mt-0.5 block font-body text-[12px] leading-snug text-ink-muted">{l.tagline[locale]}</span>
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-ink-dim">
            {ui.pick}: <span className="text-accent">{chosen.label[locale]}</span>
          </p>
          <p className="mt-1.5 font-body text-[14px] leading-relaxed text-ink">{chosen.verdict[locale]}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link
              href={`/${locale}${chosen.base.href}`}
              className="flex items-center justify-between rounded-lg border border-accent/40 px-3 py-2 font-body text-[13px] text-accent hover:bg-accent/10"
            >
              <span className="text-ink-dim">{ui.base}</span>
              <span className="font-bold">{chosen.base.label[locale]} →</span>
            </Link>
            <Link
              href={`/${locale}${chosen.rubbers.href}`}
              className="flex items-center justify-between rounded-lg border border-accent/40 px-3 py-2 font-body text-[13px] text-accent hover:bg-accent/10"
            >
              <span className="text-ink-dim">{ui.rubbers}</span>
              <span className="font-bold">{chosen.rubbers.label[locale]} →</span>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="mt-3 font-body text-[12px] text-ink-dim underline hover:text-ink"
          >
            {ui.reset}
          </button>
        </div>
      )}
    </section>
  );
}
