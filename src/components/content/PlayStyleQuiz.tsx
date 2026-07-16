"use client";

import { useState } from "react";
import Link from "next/link";
import { type Locale } from "@/i18n/config";

type StyleKey = "attack" | "defense" | "allround";
type L = Record<Locale, string>;

const UI: Record<Locale, { kicker: string; heading: string; hint: string; picked: string; reset: string; recommend: string }> = {
  ua: {
    kicker: "Інтерактив",
    heading: "Який у тебе стиль гри?",
    hint: "Обери — підкажемо інвентар під тебе.",
    picked: "Твій вибір",
    reset: "Обрати ще раз",
    recommend: "Що обрати",
  },
  ru: {
    kicker: "Интерактив",
    heading: "Какой у тебя стиль игры?",
    hint: "Выбери — подскажем инвентарь под тебя.",
    picked: "Твой выбор",
    reset: "Выбрать ещё раз",
    recommend: "Что выбрать",
  },
};

type StyleDef = {
  key: StyleKey;
  label: L;
  tagline: L;
  verdict: L;
  links: { label: L; href: string }[];
};

const STYLES: StyleDef[] = [
  {
    key: "attack",
    label: { ua: "Атака", ru: "Атака" },
    tagline: {
      ua: "Граю першим темпом, тисну топспіном",
      ru: "Играю первым темпом, давлю топспином",
    },
    verdict: {
      ua: "Тобі потрібні швидкі спінові накладки й карбонова основа: більше швидкості й обертання за столом.",
      ru: "Тебе нужны быстрые спиновые накладки и карбоновое основание: больше скорости и вращения у стола.",
    },
    links: [
      { label: { ua: "Накладки Tenergy / Dignics", ru: "Накладки Tenergy / Dignics" }, href: "/nakladki" },
      { label: { ua: "Основи ALC", ru: "Основания ALC" }, href: "/osnovaniya/alc" },
    ],
  },
  {
    key: "defense",
    label: { ua: "Захист", ru: "Защита" },
    tagline: {
      ua: "Тримаю м'яч у грі, змушую помилятись",
      ru: "Держу мяч в игре, заставляю ошибаться",
    },
    verdict: {
      ua: "Твій вибір — довгі шипи або антиспін і контрольна, не надто швидка основа.",
      ru: "Твой выбор — длинные шипы или антиспин и контрольное, не слишком быстрое основание.",
    },
    links: [
      { label: { ua: "Довгі шипи", ru: "Длинные шипы" }, href: "/nakladki?surfaceType=dovgi-shypy" },
      { label: { ua: "Основи для контролю", ru: "Основания для контроля" }, href: "/osnovaniya" },
    ],
  },
  {
    key: "allround",
    label: { ua: "Універсал", ru: "Универсал" },
    tagline: {
      ua: "І атака, і контроль — залежно від ситуації",
      ru: "И атака, и контроль — в зависимости от ситуации",
    },
    verdict: {
      ua: "Бери збалансовані накладки середньої жорсткості (Tenergy 05 FX, Rozena) і універсальну основу.",
      ru: "Бери сбалансированные накладки средней жёсткости (Tenergy 05 FX, Rozena) и универсальное основание.",
    },
    links: [
      { label: { ua: "Готові ракетки", ru: "Готовые ракетки" }, href: "/rakety" },
      { label: { ua: "Усі накладки", ru: "Все накладки" }, href: "/nakladki" },
    ],
  },
];

export function PlayStyleQuiz({ locale }: { locale: Locale }) {
  const ui = UI[locale];
  const [picked, setPicked] = useState<StyleKey | null>(null);
  const chosen = STYLES.find((s) => s.key === picked) ?? null;

  return (
    <section className="my-10 rounded-2xl border border-border-subtle bg-bg-raised p-5 sm:p-6">
      <p className="mb-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{ui.kicker}</p>
      <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-ink">{ui.heading}</h2>
      <p className="mb-4 font-body text-[13px] text-ink-muted">{ui.hint}</p>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {STYLES.map((s) => {
          const active = s.key === picked;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setPicked(active ? null : s.key)}
              aria-pressed={active}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <span className={`block font-display text-[15px] font-bold uppercase ${active ? "text-accent" : "text-ink"}`}>
                {s.label[locale]}
              </span>
              <span className="mt-0.5 block font-body text-[12px] leading-snug text-ink-muted">{s.tagline[locale]}</span>
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-ink-dim">
            {ui.picked}: <span className="text-accent">{chosen.label[locale]}</span>
          </p>
          <p className="mt-1.5 font-body text-[14px] leading-relaxed text-ink">{chosen.verdict[locale]}</p>
          <p className="mt-3 mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            {ui.recommend}
          </p>
          <div className="flex flex-wrap gap-2">
            {chosen.links.map((l, i) => (
              <Link
                key={i}
                href={`/${locale}${l.href}`}
                className="rounded-full border border-accent/40 px-3 py-1 font-body text-[13px] text-accent hover:bg-accent/10"
              >
                {l.label[locale]}
              </Link>
            ))}
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
